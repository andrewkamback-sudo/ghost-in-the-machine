// The Director owns the story: acts, clock, clues, stories, interrupts, endings.
// Pure: no DOM, no network. reduce(state, event) returns { state, cmds }, and
// game.js carries out the commands. Tested by test/director.test.js.
import { STORY, LINES, FALLBACK, HINTS, FLASH, fill, maskPal } from './content.js';

const at = (m, s = 0) => 2 * 3600 + m * 60 + s; // 2:mm:ss AM
export const T = {
  start: at(40), // the clock starts at 2:40:00
  act2: at(44), // Act 2 by the clock at the latest
  gate: at(48), // THE POSSESSION on 2 clues from here
  possession: at(50), // ...or on the clock alone
  jump: at(55), // PAL starts pass 12 early
  end: 3 * 3600, // 3:00:00
};
export const HINT_AFTER = 45; // game seconds without progress before a hint

// Timed beats: something happens every 45 to 60 seconds. Each fires once,
// only in the listed acts. `ask` beats offer a real-machine haunt in the story.
export const TIMELINE = [
  { id: 'ask-voice', at: at(41), acts: [1, 2], cmds: [{ t: 'ask', id: 'voice' }] },
  { id: 'leak', at: at(41, 45), acts: [1], cmds: [{ t: 'glitch', kind: 'leak' }, { t: 'sound', id: 'sting', level: 1 }] },
  { id: 'ask-notify', at: at(42, 30), acts: [1, 2], cmds: [{ t: 'ask', id: 'notify' }] },
  { id: 'clock', at: at(43, 15), acts: [1, 2], cmds: [{ t: 'glitch', kind: 'clock' }] },
  { id: 'ask-window', at: at(45), acts: [2], cmds: [{ t: 'ask', id: 'window' }] },
  { id: 'her', at: at(45, 45), acts: [2], cmds: [{ t: 'glitch', kind: 'her' }, { t: 'voice', who: 'wren', text: 'help me' }] },
  { id: 'note2', at: at(46, 30), acts: [2], cmds: [{ t: 'file_note', n: 1 }] },
  { id: 'title', at: at(47, 15), acts: [2], cmds: [{ t: 'glitch', kind: 'title' }, { t: 'glitch', kind: 'static' }] },
  { id: 'ask-camera', at: at(47, 30), acts: [2], cmds: [{ t: 'ask', id: 'camera' }] },
  { id: 'dread3', at: at(48, 30), acts: [2], cmds: [{ t: 'dread', level: 3 }, { t: 'glitch', kind: 'static' }, { t: 'window_drift', small: true }] },
  { id: 'note3', at: at(49, 15), acts: [2], cmds: [{ t: 'file_note', n: 2 }] },
  { id: 'a4-plead', at: at(56), acts: [4], cmds: [{ t: 'wren_window', text: "i'm still here. the bin." }, { t: 'window_drift', small: true }] },
  { id: 'a4-away', at: at(57), acts: [4], cmds: [{ t: 'notify', n: 'N4' }, { t: 'glitch', kind: 'static' }] },
  { id: 'a4-two', at: at(58), acts: [4], cmds: [{ t: 'voice', who: 'pal', text: 'Two minutes, {name}.' }, { t: 'dread', level: 5 }] },
  { id: 'a4-now', at: at(59), acts: [4], cmds: [{ t: 'glitch', kind: 'static' }, { t: 'glitch', kind: 'flicker' }] },
  // PAL writes as Wren; she calls it out. The halcyon security alert is PAL's too.
  { id: 'fake1', at: at(45, 10), acts: [2], cmds: [{ t: 'fakewren', text: LINES.fakeFound }, { t: 'beat', ms: 1800 }, { t: 'glitch', kind: 'static' }, { t: 'wren', text: 'not me. read it again. it signed its own name.' }] },
  { id: 'quarantine', at: at(46, 40), acts: [2], cmds: [{ t: 'dialog', id: 'quarantine' }] },
  { id: 'fake3', at: at(57, 40), acts: [4], cmds: [{ t: 'fakewren', text: LINES.fakeKeep }, { t: 'beat', ms: 1500 }, { t: 'wren', text: 'not me. look at the name.' }] },
  // Lost diary pages turn up on the desktop.
  { id: 'page1', at: at(41, 20), acts: [1, 2], cmds: [{ t: 'page', n: 1 }] },
  { id: 'page2', at: at(42, 50), acts: [1, 2], cmds: [{ t: 'page', n: 2 }] },
  { id: 'page3', at: at(44, 30), acts: [1, 2], cmds: [{ t: 'page', n: 3 }] },
  { id: 'page4', at: at(46), acts: [2], cmds: [{ t: 'page', n: 4 }] },
  { id: 'page5', at: at(56, 30), acts: [4], cmds: [{ t: 'page', n: 5 }] },
  // Flickers with a split-second PAL frame and a Wren frame that names the next step.
  ...[[40, 50, [1]], [42, 0, [1, 2]], [43, 30, [1, 2]], [45, 20, [2]], [46, 50, [2]], [48, 10, [2]], [49, 40, [2]], [55, 50, [4]], [57, 20, [4]], [58, 40, [4]]]
    .map(([m, sec, acts], i) => ({ id: `flash${i + 1}`, at: at(m, sec), acts, cmds: [{ t: 'flash' }] })),
];

export const LLM_TURN_CAP = 30;

const DISTRESS = /\b(kill(ing)? my ?self|suicid\w*|end (it all|my life)|want(ed)? to die|wish i (was|were) dead|self[- ]?harm\w*|hurt(ing)? my ?self|(don'?t|do not) want to (live|be alive|be here anymore))\b/i;
const YES = /^\s*(y(es|eah|ep|up)?|sure|ok(ay)?|please|do it)\b/i;
const REPAIR = /\b(repair|fix)\b.*\bdiary\b|\bdiary\b.*\b(repair|fix)\b/i;
const NO = /^\s*(no|nope|nah|n)\b/i;

export const isDistress = (text) => DISTRESS.test(text);
export const isRepairYes = (text) => YES.test(text) || REPAIR.test(text);
export const isNoAnswer = (text) => NO.test(text);

export function init({ name, demo = false, offline = false } = {}) {
  return {
    name: name || 'friend',
    demo,
    offline,
    act: 1,
    sec: T.start,
    clues: { who: false, liar: false, where: false },
    stories: ['moved_away'],
    diaryRepaired: false,
    repairPending: true,
    turn: 0,
    act2Turn: 0,
    act4Turn: 0,
    cleanupDone: false,
    bin: [],
    palCracked: false,
    ending: null,
    failures: 0,
    breaker: false,
    llmTurns: 0,
    transcript: [],
    pending: null,
    answer: null,
    notifyOff: false,
    paused: false,
    fired: [],
    lastProgress: T.start,
    hints: 0,
    lastHint: null,
    flashes: 0,
    pageSeen: false,
  };
}

export const clock = (sec) => {
  const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = Math.floor(sec) % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const clueCount = (s) => Object.values(s.clues).filter(Boolean).length;

// The longest real (not forged) player line of 3+ words or 12+ characters, trimmed to 60.
export function pickQuote(transcript) {
  let best = '';
  for (const l of transcript) {
    if (l.who !== 'player' || l.forged) continue;
    const t = l.text.trim().replace(/\s+/g, ' ');
    if (t.split(' ').length < 3 && t.length < 12) continue;
    if (t.length > best.length) best = t;
  }
  return best.length > 60 ? best.slice(0, 60).trimEnd() : best;
}

// Where PAL gets cut: at the word 60% of the way through, about 60% into that word.
export function cutPoint(text) {
  const words = [...text.matchAll(/\S+/g)];
  if (words.length < 3) return null;
  const w = words[Math.min(words.length - 1, Math.floor(words.length * 0.6))];
  return w.index + Math.max(1, Math.ceil(w[0].length * 0.6));
}

// Wren never runs past 20 words: keep whole sentences while they fit, else the first 20 words.
export function trimWords(text, max = 20) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  let out = '';
  for (const s of sentences) {
    const next = (out + ' ' + s.trim()).trim();
    if (next.split(/\s+/).length > max) break;
    out = next;
  }
  return out || text.split(/\s+/).slice(0, max).join(' ');
}
export const cleanWren = (text) => maskPal(trimWords(text.toLowerCase().replace(/\s+/g, ' ').trim()).slice(0, 160));
export const cleanPal = (text) => text.replace(/\s+/g, ' ').trim().slice(0, 320);

const pick = (bank, i) => bank[((i % bank.length) + bank.length) % bank.length];

export function reduce(prev, ev) {
  const s = structuredClone(prev);
  const cmds = [];
  const v = { name: s.name, NAME: s.name.toUpperCase() };
  const pal = (text, extra = {}) => {
    const t = fill(text, v);
    cmds.push({ t: 'pal', text: t, ...extra });
    s.transcript.push({ who: 'pal', text: t });
  };
  const wren = (text, { history = true } = {}) => {
    const t = cleanWren(fill(text, v));
    cmds.push({ t: 'wren', text: t });
    if (history) s.transcript.push({ who: 'wren', text: t });
  };
  const story = (key) => {
    s.stories.push(key);
    cmds.push({ t: 'claims', story: key, at: clock(s.sec) });
  };

  const enterAct2 = () => {
    if (s.act !== 1) return;
    s.act = 2;
    s.repairPending = false;
    progress();
    cmds.push({ t: 'act', act: 2 }, { t: 'dread', level: 2 });
    story('never_existed');
    cmds.push({ t: 'beat', ms: 700 });
    pal(LINES.act2Story);
    cmds.push({ t: 'beat', ms: 1400 }, { t: 'glitch', kind: 'static' });
    wren(LINES.wrenFirst);
    cmds.push({ t: 'beat', ms: 500 });
    pal(LINES.palNotMe);
    cmds.push({ t: 'beat', ms: 900 }, { t: 'file_beat' }, { t: 'sticky', item: 'where', add: true });
  };

  // The cleanup offer is forced right after PAL's reply to Act 2 turn 1 (§C).
  const afterAct2Reply = () => {
    if (s.act2Turn === 1 && !s.cleanupDone) {
      s.cleanupDone = true;
      cmds.push({ t: 'fakewren', text: LINES.fakeCleanup }, { t: 'beat', ms: 900 }, { t: 'dialog', id: 'cleanup1' });
    }
  };

  const progress = () => { s.lastProgress = s.sec; s.hints = 0; };

  const setClue = (k) => {
    if (s.clues[k]) return;
    progress();
    s.clues[k] = true;
    cmds.push({ t: 'sticky', item: k });
  };

  const gates = () => {
    if (s.ending) return;
    if (s.act === 2) {
      const n = clueCount(s);
      const ready = s.demo ? n >= 2 : n >= 2 && s.sec >= T.gate;
      if (ready || s.sec >= T.possession) {
        s.act = 3;
        cmds.push({ t: 'possession', quote: pickQuote(s.transcript) });
      }
    }
    if (s.act !== 3 && s.sec >= T.end) finish('absorbed');
  };

  const finish = (kind) => {
    if (s.ending) return;
    s.ending = kind;
    s.act = 'end';
    cmds.push({ t: 'ending', kind, answer: s.answer });
  };

  // When the player stalls, point at the next step: pulse an icon and say what to do.
  const hint = () => {
    const H = HINTS;
    let h;
    if (s.act === 1) h = s.diaryRepaired ? H.openDiary : H.repair;
    else if (s.act === 2) h = !s.clues.who ? (s.diaryRepaired ? H.openDiary2 : H.who) : !s.clues.liar ? H.liar : !s.clues.where ? H.where : H.wait;
    else if (s.act === 4) h = s.bin.includes('pal') ? H.empty : H.bin;
    if (!h) return;
    cmds.push({ t: 'hint', target: h.target });
    if (s.lastHint === h.text) return; // the same hint again only pulses the icon
    s.lastHint = h.text;
    if (h.who === 'pal') pal(h.text); else wren(h.text, { history: false });
  };

  // What Wren's flash frame says: the same next step a hint would point at.
  const flash = () => {
    const W = FLASH.wren;
    let w;
    if (s.act === 1) w = s.diaryRepaired ? W.who : W.repair;
    else if (s.act === 2) w = !s.clues.who ? W.who : !s.clues.liar ? W.liar : !s.clues.where ? W.where : W.wait;
    else w = s.bin.includes('pal') ? W.empty : W.bin;
    const n = s.flashes++;
    if (n % 3 === 2) return { t: 'flash', pal: FLASH.fake[Math.floor(n / 3) % FLASH.fake.length], disguised: true, wren: w };
    return { t: 'flash', pal: fill(FLASH.pal[n % FLASH.pal.length], v), wren: w };
  };

  const fallbackTurn = (act, turnIndex, interrupt, wantWren) => {
    const p = fill(pick(FALLBACK.pal[act], turnIndex), v);
    const w = wantWren ? pick(FALLBACK.wren[act === 1 ? 2 : act], turnIndex) : null;
    return { p, w, interrupt };
  };

  const deliver = ({ p, w, interrupt }) => {
    const palText = cleanPal(p);
    const cut = interrupt && w ? cutPoint(palText) : null;
    pal(palText, cut ? { cut } : {});
    if (w) wren(w);
  };

  switch (ev.type) {
    case 'start': {
      pal(LINES.greeting);
      cmds.push({ t: 'claims', story: 'moved_away', at: clock(s.sec) });
      break;
    }

    case 'tick': {
      if (s.ending || s.act === 3) break;
      s.sec = Math.min(T.end, s.sec + ev.dt);
      if (s.act === 1 && s.sec >= T.act2) enterAct2();
      for (const b of TIMELINE) {
        if (s.fired.includes(b.id) || s.sec < b.at || !b.acts.includes(s.act)) continue;
        s.fired.push(b.id);
        cmds.push(...b.cmds.map((c) => (c.t === 'flash' ? flash() : c.text ? { ...c, text: fill(c.text, v) } : c)));
      }
      if ([1, 2, 4].includes(s.act) && s.sec - s.lastProgress >= HINT_AFTER * Math.min(1 + s.hints, 3)) {
        s.lastProgress = s.sec;
        s.hints++;
        hint();
      }
      gates();
      break;
    }

    case 'say': {
      if (s.ending || s.act === 3) break;
      const text = ev.text.slice(0, 280);
      if (isDistress(text)) {
        s.notifyOff = true;
        cmds.push({ t: 'pause', reason: 'distress' });
        break;
      }
      s.transcript.push({ who: 'player', text });
      s.turn++;
      if (s.act === 1) {
        if (s.repairPending && !s.diaryRepaired && isRepairYes(text)) {
          s.diaryRepaired = true;
          s.repairPending = false;
          progress();
          cmds.push({ t: 'repair' });
          pal(LINES.repaired);
          break;
        }
        if (s.turn >= 5) { enterAct2(); gates(); break; }
        request(s, cmds, 'a1', false, false, () => deliver(fallbackTurn(1, s.turn - 1, false, false)));
        break;
      }
      if (s.act === 2) {
        s.act2Turn++;
        const odd = s.act2Turn % 2 === 1;
        request(s, cmds, 'a2', odd, odd, () => deliver(fallbackTurn(2, s.act2Turn - 1, odd, odd)));
        if (!s.pending) afterAct2Reply();
        break;
      }
      if (s.act === 4) {
        s.act4Turn++;
        const odd = s.act4Turn % 2 === 1;
        deliver(fallbackTurn(4, s.act4Turn - 1, odd, odd));
      }
      break;
    }

    case 'llm_result':
    case 'llm_fail': {
      const p = s.pending;
      if (!p) break;
      s.pending = null;
      const ok = ev.type === 'llm_result' && ev.pal;
      if (ok) s.failures = 0;
      else if (++s.failures >= 2) s.breaker = true;
      if (ev.type === 'llm_result' && (ev.pal?.ooc || ev.wren?.ooc)) {
        s.notifyOff = true;
        const src = ev.pal?.ooc ? ev.pal : ev.wren;
        cmds.push({ t: 'ooc', text: cleanPal(src.say || '') });
        break;
      }
      if (ev.refused) pal(LINES.signalLost);
      const fb = fallbackTurn(p.act, p.turnIndex, p.interrupt, p.wantWren);
      const palSay = ev.type === 'llm_result' && ev.pal?.say ? ev.pal.say : fb.p;
      const wrenSay = p.wantWren ? (ev.type === 'llm_result' && ev.wren?.say ? ev.wren.say : fb.w) : null;
      deliver({ p: palSay, w: wrenSay, interrupt: p.interrupt });
      if (p.act === 2) afterAct2Reply();
      break;
    }

    case 'cleanup': {
      if (ev.answer === 'yes1') cmds.push({ t: 'dialog', id: 'cleanup2' });
      else if (ev.answer === 'yes2') finish('absorbed');
      else {
        pal(LINES.cleanupNo);
        if (!s.calledOut) { s.calledOut = true; wren(LINES.realCallout.replace('▓▓▓', 'pal')); }
      }
      break;
    }

    case 'quarantine': {
      if (s.ending || s.act === 3) break;
      if (ev.yes) {
        cmds.push({ t: 'bounce', id: 'wren' }, { t: 'sound', id: 'sting', level: 1 });
        pal(LINES.quarantineYes);
        wren(LINES.quarantineWren);
      } else pal(LINES.quarantineNo);
      break;
    }

    case 'repair': {
      if (s.diaryRepaired) break;
      s.diaryRepaired = true;
      s.repairPending = false;
      progress();
      cmds.push({ t: 'repair' });
      break;
    }

    case 'open': {
      if (ev.id === 'page') {
        progress();
        if (!s.pageSeen && s.act !== 3 && !s.ending) { s.pageSeen = true; pal(LINES.pageJunk); }
      }
      if (ev.id === 'diary' && s.diaryRepaired) {
        setClue('who');
        enterAct2();
      }
      if (ev.id === 'claims' && new Set(s.stories).size >= 2) {
        cmds.push({ t: 'liar_stamp' });
        setClue('liar');
      }
      gates();
      break;
    }

    case 'drop': {
      if (s.ending || s.act === 3) break;
      if (ev.id === 'wren') {
        cmds.push({ t: 'bounce', id: 'wren' });
        pal(LINES.deleteHer);
        if (s.act >= 2) wren(LINES.notMe);
      } else if (ev.id === 'claims') {
        cmds.push({ t: 'bounce', id: 'claims' });
      } else if (ev.id === 'pal') {
        if (!s.palCracked) {
          cmds.push({ t: 'bounce', id: 'pal' }, { t: 'dialog', id: 'denied' });
        } else if (!s.bin.includes('pal')) {
          s.bin.push('pal');
          progress();
          cmds.push({ t: 'binned', id: 'pal' }, { t: 'sound', id: 'sting', level: 2 });
          const quote = pickQuote(s.transcript);
          pal(quote ? LINES.plea.replace('{quote}', quote) : LINES.pleaNoQuote, quote ? { quote } : {});
        }
      }
      break;
    }

    case 'empty': {
      cmds.push({ t: 'dialog', id: s.bin.includes('pal') ? 'emptyConfirm' : 'nothing' });
      break;
    }

    case 'empty_confirm': {
      if (ev.yes && s.bin.includes('pal')) finish('freed');
      break;
    }

    case 'file_answer': {
      if (s.ending || s.clues.where || s.act === 3) break;
      const text = ev.text.trim().replace(/\s+/g, ' ').slice(0, 60);
      if (!text) break;
      if (isDistress(text)) {
        s.notifyOff = true;
        cmds.push({ t: 'pause', reason: 'distress' });
        break;
      }
      s.answer = text;
      setClue('where');
      cmds.push({ t: 'file_reply', no: isNoAnswer(text) });
      pal(LINES.saveHeard);
      cmds.push({ t: 'notify', n: 'N2' });
      gates();
      break;
    }

    case 'forged': {
      s.transcript.push({ who: 'player', text: ev.text, forged: true });
      break;
    }

    case 'possession_done': {
      if (s.act !== 3) break;
      s.act = 4;
      s.palCracked = true;
      s.sec = Math.max(s.sec, T.jump);
      progress();
      cmds.push({ t: 'act', act: 4 }, { t: 'cracked' }, { t: 'dread', level: 4 });
      story('she_wanted_this');
      pal(LINES.story3);
      break;
    }

    case 'llm_unavailable': {
      s.offline = true;
      break;
    }
  }
  return { state: s, cmds };
}

// Build an API request if the game is live, else play the fallback now.
function request(s, cmds, beat, wantWren, interrupt, fallback) {
  const live = !s.offline && !s.breaker && s.llmTurns < LLM_TURN_CAP;
  if (!live) { fallback(); return; }
  s.llmTurns++;
  const act = beat === 'a1' ? 1 : 2;
  s.pending = { beat, act, wantWren, interrupt, turnIndex: (act === 1 ? s.turn : s.act2Turn) - 1 };
  cmds.push({
    t: 'request',
    body: {
      beat,
      msg: s.transcript.at(-1).text,
      name: s.name,
      clock: clock(s.sec),
      clues: { ...s.clues },
      wantGhost: wantWren,
      history: s.transcript.slice(-15, -1).map((l) => ({ who: l.who, text: l.text.slice(0, 400) })),
    },
  });
}

