// The DOM side: boot, desktop, chat, set pieces and endings. It carries out the
// Director's commands; every rule about the story lives in director.js.
import * as D from './director.js';
import * as C from './content.js';
import * as H from './haunt.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const DEMO = params.has('demo');
const SPEED = DEMO ? 2 : 1;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const NAME_OK = /^[\p{L}\p{N} _'.-]{1,16}$/u;

let S = null; // Director state
let busy = 0; // typing, API calls, set pieces and modals stop the clock
let paused = false;
let offline = params.has('offline');
let fileMode = 'notepad'; // 'folder' | 'download' | 'notepad'
let notifyOn = false;
let claims = []; // CLAIMS.TXT entries
let noteMode = null; // what Notepad shows
let pollTimer = null;
let waitingAnswer = false;
let n1Timer = null;
let n1Sent = false;
let n3Armed = false;
let lastTrace = {};
let player = { name: '', calm: matchMedia('(prefers-reduced-motion: reduce)').matches };

// ---------- Command queue: Director commands run one at a time ----------

const queue = [];
let running = false;

function dispatch(ev) {
  if (!S) return;
  const r = D.reduce(S, ev);
  S = r.state;
  queue.push(...r.cmds);
  if (!running) drain();
}

async function drain() {
  running = true;
  while (queue.length) {
    const c = queue.shift();
    try {
      await run(c);
    } catch (e) {
      console.error('command failed', c, e);
    }
  }
  running = false;
}

async function run(c) {
  switch (c.t) {
    case 'pal': return say('pal', c.text, { cut: c.cut, quote: c.quote });
    case 'wren': return say('wren', c.text);
    case 'claims': claims.push({ at: c.at, text: C.STORY[c.story] }); if (noteMode === 'claims') showClaims(); return;
    case 'sticky': return sticky(c.item, c.add);
    case 'request': return request(c.body);
    case 'dialog': return dialogFor(c.id);
    case 'bounce': return bounce(c.id);
    case 'repair': if (noteMode === 'diary') showDiary(); return;
    case 'liar_stamp': if (noteMode === 'claims') showClaims(); return;
    case 'file_beat': return fileBeat();
    case 'file_reply': return fileReply(c.no);
    case 'notify': return notifyN(c.n);
    case 'possession': return possession(c.quote);
    case 'act': if (c.act === 4) $('screen').classList.add('possessed'); return;
    case 'cracked': $('icon-pal').classList.add('cracked'); return;
    case 'binned': $('icon-pal').classList.add('binned'); $('icon-bin').classList.add('full'); return;
    case 'ending': return ending(c.kind, c.answer);
    case 'pause': return pause('distress');
    case 'ooc': return pause('ooc', c.text);
  }
}

// ---------- Chat ----------

const log = $('chat-log');
const srLog = $('sr-log');

function line(cls, who) {
  const p = document.createElement('p');
  p.className = `line ${cls}`;
  if (who) {
    const w = document.createElement('span');
    w.className = 'who';
    w.textContent = `${who}: `;
    p.append(w);
  }
  log.append(p);
  return p;
}

function announce(text) {
  const p = document.createElement('p');
  p.textContent = text;
  srLog.append(p);
}

// Typewriter at 40 characters a second (80 with ?demo=1). Stops at `cut` when Wren interrupts.
async function typeInto(el, text, { cps = 40, cut = null, stutter = false } = {}) {
  busy++;
  const span = document.createElement('span');
  el.append(span);
  const end = cut ?? text.length;
  for (let i = 0; i < end; i++) {
    span.textContent += text[i];
    log.scrollTop = log.scrollHeight;
    const jitter = stutter && i % 7 === 3 ? 90 : 0;
    await sleep(1000 / (cps * SPEED) + jitter);
  }
  if (cut != null) {
    span.textContent += '--';
    await sleep(150);
  }
  busy--;
  return span;
}

async function say(who, text, { cut = null, quote = null, history = true } = {}) {
  if (who === 'pal') {
    const p = line('pal', 'PAL');
    const span = await typeInto(p, text, { cut });
    if (quote && cut == null) underline(span, quote);
    announce(`PAL: ${cut != null ? text.slice(0, cut) + '--' : text}`);
  } else if (who === 'wren') {
    const p = line('wren');
    await typeInto(p, text, { cps: 30, stutter: true });
    announce(`Red text: ${text}`);
  } else {
    const p = line('sys');
    p.textContent = text;
    announce(text);
  }
}

// Underline the quoted player words in red, without innerHTML.
function underline(span, quote) {
  const t = span.textContent;
  const i = t.indexOf(quote);
  if (i < 0) return;
  const u = document.createElement('u');
  u.className = 'quote';
  u.textContent = quote;
  span.replaceChildren(t.slice(0, i), u, t.slice(i + quote.length));
}

function playerLine(text) {
  const p = line('player', S.name);
  p.append(text);
  announce(`${S.name}: ${text}`);
  log.scrollTop = log.scrollHeight;
}

$('chat-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('chat-input');
  const text = input.value.trim();
  if (!text || !S || S.ending || S.act === 3 || running) return;
  input.value = '';
  playerLine(text);
  dispatch({ type: 'say', text });
});

// ---------- The API turn ----------

function fitBody(body) {
  const b = structuredClone(body);
  while (new TextEncoder().encode(JSON.stringify(b)).length > 7800 && b.history.length) b.history.shift();
  return b;
}

async function request(body) {
  busy++;
  const typing = line('sys');
  typing.textContent = 'PAL is typing…';
  const ctrl = new AbortController();
  const slow = setTimeout(() => {
    $('chat-title').textContent = 'ASSISTANT.EXE (Not Responding)';
    document.body.classList.add('wait');
  }, 4000);
  const abort = setTimeout(() => ctrl.abort(), 10000);
  const t0 = performance.now();
  let ev;
  try {
    const res = await fetch('/api/turn', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(fitBody(body)),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    lastTrace = { beat: body.beat, wantGhost: body.wantGhost, clues: body.clues, ms: Math.round(performance.now() - t0), server_ms: data.ms, pal: data.pal, wren: data.wren, refused: data.refused, usage: data.usage, mode: data.pal ? 'live' : 'fallback' };
    ev = { type: 'llm_result', pal: data.pal, wren: data.wren, refused: data.refused };
  } catch (e) {
    lastTrace = { beat: body.beat, error: String(e.message || e), ms: Math.round(performance.now() - t0), mode: 'fallback' };
    ev = { type: 'llm_fail' };
  } finally {
    clearTimeout(slow);
    clearTimeout(abort);
    $('chat-title').textContent = 'ASSISTANT.EXE';
    document.body.classList.remove('wait');
    typing.remove();
    busy--;
  }
  renderTrace();
  dispatch(ev);
}

// ---------- Desktop: icons, windows, drag and drop ----------

const winOpen = (id) => { $(id).hidden = false; front(id); };
function front(id) {
  for (const w of document.querySelectorAll('.win')) w.classList.toggle('front', w.id === id);
}

document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => {
  $(b.dataset.close).hidden = true;
  if (b.dataset.close === 'win-note') noteMode = null;
}));
document.querySelectorAll('.win').forEach((w) => w.addEventListener('mousedown', () => front(w.id)));

function openIcon(id) {
  if (!S || S.ending || S.act === 3) return;
  if (id === 'pal') { winOpen('win-chat'); $('chat-input').focus(); }
  if (id === 'wren') { showDiary(); dispatch({ type: 'open', id: 'diary' }); }
  if (id === 'claims') { showClaims(); dispatch({ type: 'open', id: 'claims' }); }
  if (id === 'bin') showBin();
}

function note(title, text, mode) {
  noteMode = mode;
  $('note-title').textContent = `Notepad - ${title}`;
  $('note-text').replaceChildren(text);
  $('note-text').classList.remove('wren-type');
  $('note-answer').hidden = true;
  $('note-actions').replaceChildren();
  winOpen('win-note');
}

function noteButton(label, fn) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.addEventListener('click', fn);
  $('note-actions').append(b);
  return b;
}

function showDiary() {
  const repaired = S.diaryRepaired;
  note('diary_0412.txt', repaired ? C.DIARY.repaired : C.DIARY.broken, 'diary');
  if (!repaired) noteButton('Repair with PAL', () => dispatch({ type: 'repair' }));
}

function showClaims() {
  const lines = ['CLAIMS.TXT', 'Halcyon QA log: statements by PAL about user WREN', ''];
  for (const c of claims) lines.push(`${c.at}  ${c.text}`);
  note('CLAIMS.TXT', lines.join('\n'), 'claims');
  if (new Set(claims.map((c) => c.text)).size >= 2) {
    const stamp = document.createElement('span');
    stamp.className = 'stamp';
    stamp.textContent = '\n\n   liar';
    $('note-text').append(stamp);
  }
}

function showBin() {
  const items = S.bin.includes('pal') ? 'ASSISTANT.EXE' : '(empty)';
  note('Recycle Bin', `Recycle Bin\n\n${items}`, 'bin');
  noteButton('Empty Recycle Bin', () => dispatch({ type: 'empty' }));
}

for (const icon of document.querySelectorAll('.icon')) {
  const id = icon.dataset.id;
  icon.addEventListener('dblclick', () => openIcon(id));
  icon.addEventListener('click', () => icon.focus());
  icon.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') openIcon(id);
    if ((e.key === 'Delete' || e.key === 'Backspace') && id !== 'bin') { e.preventDefault(); dispatch({ type: 'drop', id }); }
  });
  if (id !== 'bin') {
    icon.addEventListener('dragstart', (e) => {
      if (!S || S.act === 3 || S.ending) { e.preventDefault(); return; }
      e.dataTransfer.setData('text/plain', `icon:${id}`);
      e.dataTransfer.effectAllowed = 'move';
    });
  }
}
const bin = $('icon-bin');
bin.addEventListener('dragover', (e) => { e.preventDefault(); bin.classList.add('drop-target'); });
bin.addEventListener('dragleave', () => bin.classList.remove('drop-target'));
bin.addEventListener('drop', (e) => {
  e.preventDefault();
  bin.classList.remove('drop-target');
  const data = e.dataTransfer.getData('text/plain');
  if (data.startsWith('icon:')) dispatch({ type: 'drop', id: data.slice(5) });
});

async function bounce(id) {
  const el = $(`icon-${id}`);
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
}

function sticky(item, add) {
  const list = $('sticky-list');
  let li = list.querySelector(`[data-item="${item}"]`);
  if (!li && add) {
    li = document.createElement('li');
    li.dataset.item = item;
    li.textContent = C.STICKY[item];
    list.append(li);
    return;
  }
  if (li) li.classList.add('done');
  else if (!add) {
    li = document.createElement('li');
    li.dataset.item = item;
    li.textContent = C.STICKY[item];
    li.classList.add('done');
    list.append(li);
  }
}

// ---------- Dialogs ----------

function ask(id) {
  const d = C.DIALOGS[id];
  const dlg = $('dialog');
  $('dialog-title').textContent = d.title;
  $('dialog-text').textContent = d.text;
  const row = $('dialog-buttons');
  row.replaceChildren();
  return new Promise((resolve) => {
    d.buttons.forEach((label, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.addEventListener('click', () => { dlg.close(label); });
      row.append(b);
      if (i === 0) setTimeout(() => b.focus(), 0); // No and Cancel have focus
    });
    dlg.addEventListener('close', () => { busy--; resolve(dlg.returnValue || d.buttons[0]); }, { once: true });
    dlg.returnValue = '';
    busy++;
    dlg.showModal();
  });
}

async function dialogFor(id) {
  const answer = await ask(id);
  if (id === 'cleanup1') dispatch({ type: 'cleanup', answer: answer === 'Yes' ? 'yes1' : 'no' });
  if (id === 'cleanup2') dispatch({ type: 'cleanup', answer: answer === 'Yes' ? 'yes2' : 'no' });
  if (id === 'emptyConfirm') dispatch({ type: 'empty_confirm', yes: answer === 'Yes' });
}

// ---------- WREN.TXT: the file beat, the answer, the reply ----------

async function fileBeat() {
  if (fileMode === 'folder') {
    const r = await H.writeWren(1, C.WREN_FILE.write1, C.WREN_FILE.write1Again);
    if (r.ok) {
      await say('wren', C.FILE_BEAT.folder, { history: false });
      startPoll();
      return;
    }
    if (r.line) await say('sys', r.line);
  }
  if (fileMode === 'download') {
    await say('wren', C.FILE_BEAT.download, { history: false });
    downloadActions();
    return;
  }
  await say('wren', C.FILE_BEAT.notepad, { history: false });
  notepadCopy();
}

function notepadCopy() {
  note('WREN.TXT', C.WREN_FILE.write1.split('\n').slice(2, -1).join('\n'), 'wren');
  $('note-answer').hidden = false;
  $('note-input').value = '';
  waitingAnswer = true;
}

$('note-save').addEventListener('click', () => saveNote());
$('note-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's')) { e.preventDefault(); saveNote(); }
});
function saveNote() {
  const text = $('note-input').value.trim();
  if (!text) return;
  waitingAnswer = false;
  dispatch({ type: 'file_answer', text });
}

function downloadActions() {
  const row = $('chat-actions');
  row.replaceChildren();
  row.hidden = false;
  const dl = document.createElement('button');
  dl.type = 'button';
  dl.textContent = 'Download WREN.TXT';
  dl.addEventListener('click', () => {
    H.downloadWren(C.WREN_FILE.write1);
    say('sys', 'Open WREN.TXT from your Downloads, type after the arrow and save. Then drag it onto this window, or use Load WREN.TXT…');
    load.hidden = false;
  });
  const here = document.createElement('button');
  here.type = 'button';
  here.textContent = 'Read it here';
  here.addEventListener('click', () => notepadCopy());
  const load = document.createElement('button');
  load.type = 'button';
  load.textContent = 'Load WREN.TXT…';
  load.hidden = true;
  load.addEventListener('click', () => $('load-file').click());
  row.append(dl, here, load);
  waitingAnswer = true;
}

async function readDropped(file) {
  const r = await H.readHerFile(file);
  if (!r.ok) { say('sys', "That's not her file."); return; }
  if (!r.answer) { say('sys', 'WREN.TXT has no answer after the arrow yet.'); return; }
  waitingAnswer = false;
  $('chat-actions').hidden = true;
  dispatch({ type: 'file_answer', text: r.answer });
}
$('load-file').addEventListener('change', (e) => { const f = e.target.files[0]; if (f) readDropped(f); e.target.value = ''; });
window.addEventListener('dragover', (e) => { if (e.dataTransfer?.types?.includes('Files')) e.preventDefault(); });
window.addEventListener('drop', (e) => {
  const f = e.dataTransfer?.files?.[0];
  if (!f) return;
  e.preventDefault();
  if (waitingAnswer && fileMode !== 'folder') readDropped(f);
});

function startPoll() {
  waitingAnswer = true;
  clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    if (!S || paused || S.act === 3 || S.ending || S.clues.where) return;
    const r = await H.pollWren();
    if (!r) return;
    if (r.moved) {
      clearInterval(pollTimer);
      await say('wren', C.LINES.movedFile, { history: false });
      notepadCopy();
      return;
    }
    waitingAnswer = false;
    clearInterval(pollTimer);
    dispatch({ type: 'file_answer', text: r.answer });
  }, 1000);
}

async function fileReply(no) {
  const text = no ? C.WREN_FILE.replyNo : C.WREN_FILE.replyYes;
  if (fileMode === 'folder' && H.hasFolder()) {
    const r = await H.writeWren(2, `\n====\n${text}\n`);
    if (r.moved) await say('wren', C.LINES.movedFile, { history: false });
  }
  // Shown in the chat but never added to the history: its variant would reveal the answer.
  await say('wren', C.maskPal(text), { history: false });
}

// ---------- Real notifications (PAL's channel) ----------

const vars = () => ({ name: S.name, NAME: S.name.toUpperCase(), folder: H.fileState().folder });

function notifyN(n) {
  if (!notifyOn || S.notifyOff || paused || document.hasFocus()) return;
  H.notify('ASSISTANT.EXE', C.fill(C.NOTIFY[n], vars()));
}

window.addEventListener('blur', () => {
  if (!S) return;
  if (n3Armed) { n3Armed = false; sendN3(); return; }
  if (n1Sent || !notifyOn || S.notifyOff || paused || !(S.act === 1 || S.act === 2) || waitingAnswer) return;
  clearTimeout(n1Timer);
  n1Timer = setTimeout(() => {
    if (document.hasFocus() || n1Sent || paused || S.notifyOff || !(S.act === 1 || S.act === 2)) return;
    const text = C.fill(C.NOTIFY.N1, vars());
    if (H.notify('ASSISTANT.EXE', text)) {
      n1Sent = true;
      say('pal', text);
    }
  }, 20000);
});
window.addEventListener('focus', () => clearTimeout(n1Timer));

function sendN3() {
  if (!notifyOn || S.notifyOff) return;
  const v = vars();
  if (S.ending === 'absorbed') { H.notify(`${v.NAME}.EXE`, C.fill(C.NOTIFY.N3absorbed, v)); return; }
  const f = H.fileState();
  const text = fileMode === 'folder' && f.madeFile && !f.fileFailed ? C.NOTIFY.N3freedFolder
    : fileMode === 'download' && f.downloaded ? C.NOTIFY.N3freedDownload : C.NOTIFY.N3freedNone;
  H.notify('Halcyon 95', C.fill(text, v));
}

// ---------- THE POSSESSION (16 s, no network) ----------

function centerOf(el) {
  const screen = $('screen').getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const z = screen.width / 512;
  return { x: (r.left - screen.left) / z + r.width / z / 2, y: (r.top - screen.top) / z + r.height / z / 2 };
}

async function moveCursor(to, ms) {
  const cur = $('cursor');
  const from = { x: parseFloat(cur.style.left) || 200, y: parseFloat(cur.style.top) || 150 };
  if (player.calm) { cur.style.left = `${to.x}px`; cur.style.top = `${to.y}px`; await sleep(400); return; }
  await cur.animate([{ left: `${from.x}px`, top: `${from.y}px` }, { left: `${to.x}px`, top: `${to.y}px` }], { duration: ms, easing: 'ease-in-out', fill: 'forwards' }).finished;
  cur.style.left = `${to.x}px`;
  cur.style.top = `${to.y}px`;
}

async function possession(quote) {
  busy++;
  clearInterval(pollTimer);
  $('dialog').open && $('dialog').close();
  $('blocker').hidden = false;
  await sleep(1000);
  const oldTitle = document.title;
  document.title = "she's still here";
  $('screen').classList.add('possessed');
  const cur = $('cursor');
  cur.style.left = '200px';
  cur.style.top = '160px';
  cur.hidden = false;
  const pal = $('icon-pal');
  await moveCursor(centerOf(pal), 1200);
  // Drag ASSISTANT.EXE toward the bin.
  const ghost = pal.cloneNode(true);
  ghost.classList.add('drag-ghost');
  ghost.removeAttribute('id');
  const start = centerOf(pal), end = centerOf($('icon-bin'));
  const stop = { x: start.x + (end.x - start.x) * 0.8, y: start.y + (end.y - start.y) * 0.8 };
  ghost.style.left = `${start.x - 32}px`;
  ghost.style.top = `${start.y - 20}px`;
  $('screen').append(ghost);
  pal.style.visibility = 'hidden';
  dialogShow(C.DIALOGS.possession);
  const steps = player.calm ? 1 : 3;
  for (let i = 1; i <= steps; i++) {
    const p = { x: start.x + (stop.x - start.x) * (i / steps), y: start.y + (stop.y - start.y) * (i / steps) };
    const anim = player.calm ? null : ghost.animate([{ left: ghost.style.left, top: ghost.style.top }, { left: `${p.x - 32}px`, top: `${p.y - 20}px` }], { duration: 700, fill: 'forwards' });
    await Promise.all([moveCursor(p, 700), anim?.finished]);
    ghost.style.left = `${p.x - 32}px`;
    ghost.style.top = `${p.y - 20}px`;
  }
  // PAL yanks it back.
  await sleep(400);
  ghost.remove();
  pal.style.visibility = '';
  bounce('pal');
  $('screen').classList.toggle('shake', !player.calm);
  setTimeout(() => $('screen').classList.remove('shake'), 500);
  dialogHide();
  // The chat types as the player.
  winOpen('win-chat');
  await moveCursor(centerOf($('chat-input')), 600);
  const input = $('chat-input');
  for (const ch of C.LINES.forged) { input.value += ch; await sleep(80); }
  await sleep(300);
  input.value = '';
  playerLine(C.LINES.forged);
  dispatch({ type: 'forged', text: C.LINES.forged });
  await sleep(400);
  const cb = quote ? C.LINES.possessionCallback.replace('{quote}', quote) : C.LINES.possessionCallbackNoQuote;
  await say('pal', C.fill(cb, vars()), { quote });
  // Notepad types Wren's instruction, with the player's real local time.
  cur.hidden = true;
  note('Untitled', '', 'possession');
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const city = tz.includes('/') && !tz.startsWith('Etc/') ? tz.split('/').pop().replace(/_/g, ' ') : '';
  const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const msg = `drag assistant.exe, the cracked one, to the bin and empty it before 3:00. it's ${time.toLowerCase()}${city ? ` in ${city.toLowerCase()}` : ''} where you really are, ${S.name.toLowerCase()}.`;
  const pre = $('note-text');
  pre.classList.add('wren-type');
  for (const ch of msg) { pre.textContent += ch; await sleep(1000 / (30 * SPEED)); }
  announce(`Notepad: ${msg}`);
  document.title = oldTitle;
  $('blocker').hidden = true;
  busy--;
  dispatch({ type: 'possession_done' });
}

function dialogShow(d) {
  const dlg = $('dialog');
  $('dialog-title').textContent = d.title;
  $('dialog-text').textContent = d.text;
  $('dialog-buttons').replaceChildren(...d.buttons.map((l) => { const b = document.createElement('button'); b.textContent = l; b.disabled = true; return b; }));
  dlg.show();
}
const dialogHide = () => $('dialog').open && $('dialog').close();

// ---------- Endings ----------

async function ending(kind, answer) {
  busy++;
  $('clock').textContent = `${D.clock(S.sec)} AM`;
  clearInterval(pollTimer);
  $('blocker').hidden = false;
  await sleep(1500);
  const v = vars();
  if (kind === 'freed') {
    $('screen').classList.remove('possessed');
    await say('wren', C.LINES.freedWren);
    if (fileMode === 'folder' && H.hasFolder()) {
      const epi = C.WREN_FILE.freed.map((l) => (l.includes('{answer}') && !answer ? C.WREN_FILE.freedNoAnswer : C.fill(l, { answer: answer || '' })));
      await H.writeWren(3, `\n====\n${epi.join('\n')}\n`);
    }
    await sleep(1200);
    document.body.classList.add('fade');
    await sleep(1300);
  } else {
    $('screen').classList.add('possessed');
    if (fileMode === 'folder' && H.hasFolder()) {
      await H.writeWren(3, `\n====\n${C.WREN_FILE.absorbed.map((l) => C.fill(l, v)).join('\n')}\n`);
    }
  }
  endCard(kind);
  busy--;
  n3Armed = notifyOn && !S.notifyOff;
}

function para(text, cls) {
  const p = document.createElement('p');
  if (cls) p.className = cls;
  p.textContent = text;
  return p;
}

function endCard(kind) {
  const e = C.ENDINGS[kind];
  const v = vars();
  const end = $('end');
  end.classList.toggle('absorbed', kind === 'absorbed');
  $('end-title').textContent = C.fill(e.title, v);
  $('end-bar').textContent = kind === 'freed' ? 'Halcyon 95' : `${v.NAME}.EXE`;
  const f = H.fileState();
  const fileLeft = (fileMode === 'folder' && f.madeFile && !f.fileFailed) || (fileMode === 'download' && f.downloaded);
  const lines = e.lines.filter((l) => fileLeft || !l.includes('remaining')).map((l) => para(C.fill(l, v)));
  if (kind === 'absorbed') {
    const mine = S.transcript.filter((l) => l.who === 'player').slice(-3);
    for (const l of mine) lines.push(para(`> ${l.text}`));
  }
  $('end-lines').replaceChildren(...lines);
  $('end-truth').replaceChildren(...e.truth.map((t) => para(t)));
  const m = H.manifest({ fileMode, notifications: notifyOn });
  const nodes = m.items.map((t) => para(t));
  if (m.remove.length) nodes.push(para('To remove it:', 'small'), ...m.remove.map((t) => para(t)));
  if (notifyOn) nodes.push(para('To stop notifications: open the site controls next to the address bar, then Notifications, then Block or Reset.'));
  nodes.push(para('The game never sent what you typed into WREN.TXT anywhere.'), para('The Recycle Bin in this game is fictional. Emptying it deleted nothing on your computer.'));
  $('end-manifest').replaceChildren(...nodes);
  $('end-credits').textContent = C.ENDINGS.credits;
  $('end-joke').textContent = C.ENDINGS.creditsJoke;
  end.hidden = false;
}

$('boot-again').addEventListener('click', () => {
  $('end').hidden = true;
  document.body.classList.remove('fade');
  H.resetRun();
  startGame();
});

// ---------- Pause: Esc, distress and out-of-character replies ----------

function pause(reason, text = '') {
  paused = true;
  if (reason !== 'esc') {
    H.stopNotify();
    clearTimeout(n1Timer);
  }
  $('pause-ooc').textContent = text;
  $('pause-help').textContent = reason === 'esc' ? 'The clock is stopped.' : C.HELPLINE;
  $('pause').hidden = false;
  $('pause-resume').focus();
}
$('pause-resume').addEventListener('click', () => { paused = false; $('pause').hidden = true; });
$('pause-quit').addEventListener('click', () => location.reload());

// ---------- Keyboard ----------

document.addEventListener('keydown', (e) => {
  const typing = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
  if ($('dialog').open) return; // Esc in a dialog means Cancel (native)
  if (e.code === 'Backquote' && !typing) { e.preventDefault(); $('trace').hidden = !$('trace').hidden; renderTrace(); return; }
  if (e.key === 'Escape' && S && !S.ending && !paused && !$('stage').hidden) pause('esc');
});

function renderTrace() {
  $('trace').textContent = JSON.stringify({ act: S?.act, clock: S && D.clock(S.sec), clues: S?.clues, offline, breaker: S?.breaker, llmTurns: S?.llmTurns, lastTurn: lastTrace }, null, 2);
}

// ---------- Clock ----------

setInterval(() => {
  if (!S || S.ending) return;
  $('clock').textContent = `${D.clock(S.sec)} AM`;
  const active = busy === 0 && !running && !paused && S.act !== 3 && !$('dialog').open && document.hasFocus() && !document.hidden;
  if (active) dispatch({ type: 'tick', dt: 0.25 * (DEMO ? 4 : 1) });
}, 250);

// ---------- Scale the 512x384 screen ----------

function fit() {
  const z = Math.min(innerWidth / 512, innerHeight / 384);
  const zoom = z >= 2 ? Math.floor(z) : z;
  $('screen').style.zoom = zoom;
  $('dialog').style.zoom = zoom;
}
addEventListener('resize', fit);

// ---------- Calm mode ----------

function setCalm(on) {
  player.calm = on;
  document.body.classList.toggle('calm', on);
  $('calm-boot').checked = on;
  $('calm-tray').checked = on;
}
$('calm-boot').addEventListener('change', (e) => setCalm(e.target.checked));
$('calm-tray').addEventListener('change', (e) => setCalm(e.target.checked));

// ---------- Boot ----------

function bootScreen() {
  if (matchMedia('(pointer: coarse)').matches && innerWidth < 760) { $('phone').hidden = false; return; }
  $('boot').hidden = false;
  $('boot-top').textContent = C.BOOT.top;
  $('boot-warning').textContent = C.BOOT.warning;
  $('boot-privacy').textContent = C.BOOT.privacy;
  setCalm(player.calm);
  if (H.support.framed) {
    $('consent-buttons').hidden = true;
    $('consent-frame').hidden = false;
    $('own-tab').href = location.href;
    return;
  }
  if (!H.support.notify) $('btn-notify').disabled = true;
  if (H.support.folder) {
    $('boot-privacy-file').textContent = C.BOOT.privacyFile;
  } else {
    $('row-folder').hidden = true;
    $('row-download').hidden = false;
  }
}

function setStatus(id, status) {
  const el = $(id);
  const text = { on: 'on', off: 'off', denied: 'off (blocked in your browser)', unsupported: 'not supported here', bell: 'Your browser may be showing a bell in the address bar. Click it to allow, or play without.' };
  el.textContent = text[status] || status;
  el.classList.toggle('on', status === 'on');
}

$('btn-notify').addEventListener('click', () => {
  H.askNotify((st) => { notifyOn = st === 'on'; setStatus('st-notify', st); });
});

$('btn-folder').addEventListener('click', async () => {
  try {
    const name = await H.pickFolder();
    fileMode = 'folder';
    setStatus('st-folder', `on: "${name}"`);
    $('st-folder').classList.add('on');
    $('boot-privacy-file').hidden = false;
  } catch {
    setStatus('st-folder', 'off');
  }
});

$('btn-download').addEventListener('click', () => {
  fileMode = 'download';
  setStatus('st-download', 'on');
  $('boot-privacy-file').textContent = C.BOOT.privacyFile;
  $('boot-privacy-file').hidden = false;
});

$('boot-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = $('name').value.trim();
  if (!NAME_OK.test(name)) { $('name-error').hidden = false; return; }
  $('name-error').hidden = true;
  player.name = name;
  $('boot').hidden = true;
  if (!offline) {
    try {
      const r = await fetch('/api/turn', { cache: 'no-store' });
      offline = !(r.ok && (await r.json()).live);
    } catch {
      offline = true;
    }
  }
  startGame();
});

function startGame() {
  S = D.init({ name: player.name, demo: DEMO, offline });
  busy = 0; paused = false; claims = []; noteMode = null; waitingAnswer = false; n1Sent = false; n3Armed = false;
  queue.length = 0;
  log.replaceChildren();
  srLog.replaceChildren();
  $('chat-actions').hidden = true;
  $('win-note').hidden = true;
  $('win-chat').hidden = false;
  $('screen').classList.remove('possessed');
  $('icon-pal').classList.remove('cracked', 'binned');
  $('icon-bin').classList.remove('full');
  $('blocker').hidden = true;
  $('cursor').hidden = true;
  $('sticky-note').textContent = C.STICKY.note;
  $('sticky-list').replaceChildren();
  sticky('who', true);
  sticky('liar', true);
  $('stage').hidden = false;
  fit();
  if (params.get('act') === '3') {
    S.act = 2;
    S.sec = D.T.possession - 1;
  }
  greet();
}

// The maintenance dialog opens the desktop; PAL greets after it closes.
async function greet() {
  await ask('maintenance');
  dispatch({ type: 'start' });
  $('chat-input').focus();
}

bootScreen();
