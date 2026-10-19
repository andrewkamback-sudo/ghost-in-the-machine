// The only file that touches the player's real machine (§N): notifications,
// the chosen folder, the download, and reading a dropped file back.
// House rules, enforced by test/haunt.test.js: only appends, only to a file this
// game made, never lists, moves or deletes anything, and stores nothing.
import { WREN_HEADER } from './content.js';

const MAX = 16 * 1024;

export const support = {
  framed: window.top !== window,
  notify: 'Notification' in window,
  folder: typeof window.showDirectoryPicker === 'function',
};

// ---------- Notifications (PAL's channel) ----------

let notifyOptIn = false;
let sent = 0;
let current = null;

// Must be called directly from the click handler: requestPermission is the first call.
export function askNotify(onStatus) {
  if (!support.notify) { onStatus('unsupported'); return; }
  let settled = false;
  let request;
  try {
    request = Notification.requestPermission();
  } catch {
    request = new Promise((resolve) => Notification.requestPermission(resolve));
  }
  setTimeout(() => { if (!settled) onStatus('bell'); }, 3000);
  Promise.resolve(request).then((p) => {
    settled = true;
    notifyOptIn = p === 'granted';
    onStatus(p === 'granted' ? 'on' : p === 'denied' ? 'denied' : 'bell');
  });
}

export function notify(title, body) {
  if (!notifyOptIn || sent >= 3 || Notification.permission !== 'granted') return false;
  try {
    if (current) current.close();
    current = new Notification(title, { body });
    current.onclick = () => { window.focus(); current?.close(); };
    sent++;
    return true;
  } catch {
    return false;
  }
}

export const notifyCount = () => sent;
export const notifyEnabled = () => notifyOptIn && support.notify && Notification.permission === 'granted';
export function stopNotify() { notifyOptIn = false; }

// ---------- The real folder (Wren's channel, Chrome and Edge) ----------

const disk = {
  root: null, // the folder the player picked
  folderName: '',
  madeDir: false, // survives Boot again; reset when a new folder is picked
  madeFile: false,
  writes: 0,
  stopped: null, // reason writes stopped, or null
  fileFailed: false,
  lastModified: 0,
  stableTicks: 0,
  lastAnswer: '',
};

export async function pickFolder() {
  const root = await window.showDirectoryPicker({ id: 'halcyon95', mode: 'readwrite', startIn: 'desktop' });
  disk.root = root;
  disk.folderName = root.name;
  disk.madeDir = false;
  disk.madeFile = false;
  disk.writes = 0;
  disk.stopped = null;
  disk.fileFailed = false;
  return root.name;
}

export const hasFolder = () => !!disk.root;

// Boot again: keep the folder and what this page made; start a fresh run.
export function resetRun() {
  disk.writes = 0;
  disk.stopped = null;
  disk.fileFailed = false;
  disk.lastModified = 0;
  disk.stableTicks = 0;
  disk.lastAnswer = '';
  sent = 0;
  if (current) current.close();
  current = null;
}

async function readHead(file) {
  const head = await file.slice(0, 200).text();
  return head.replace(/^﻿/, '').split(/\r?\n/)[0].trimEnd();
}

// The guard: runs before every write. Only write 1 may create anything.
async function wrenHandle(create) {
  let dir;
  try {
    dir = await disk.root.getDirectoryHandle('Halcyon 95');
  } catch (e) {
    if (e.name !== 'NotFoundError' || !create) throw e;
    dir = await disk.root.getDirectoryHandle('Halcyon 95', { create: true });
    disk.madeDir = true;
  }
  try {
    const h = await dir.getFileHandle('WREN.TXT');
    const f = await h.getFile();
    if ((await readHead(f)) !== WREN_HEADER) throw Object.assign(new Error('foreign file'), { name: 'ForeignFile' });
    if (f.size > MAX) throw new RangeError('WREN.TXT over 16 KB');
    disk.madeFile = true;
    return { h, existed: true };
  } catch (e) {
    if (e.name !== 'NotFoundError' || !create || !disk.madeDir) throw e;
    disk.madeFile = true;
    return { h: await dir.getFileHandle('WREN.TXT', { create: true }), existed: false };
  }
}

async function append(h, text) {
  const w = await h.createWritable({ keepExistingData: true });
  try {
    const size = (await h.getFile()).size;
    await w.write({ type: 'write', position: size, data: text });
    await w.close();
  } catch (e) {
    try { await w.abort(); } catch {}
    throw e;
  }
}

const STOP_LINES = {
  ForeignFile: "A WREN.TXT this game didn't make is already there, so it was left alone.",
  ForeignFolder: "A Halcyon 95 folder this game didn't make is already there, so it was left alone.",
  RangeError: 'WREN.TXT has grown past 16 KB, so it was left alone. Delete it to start fresh.',
};

// write: 1 = the note (may create), 2 = Wren's reply, 3 = the epilogue.
// Returns { ok } or { ok: false, reason, line, moved }.
export async function writeWren(step, text, againText) {
  if (!disk.root || disk.stopped || disk.writes >= 3) return { ok: false, reason: disk.stopped || 'none' };
  try {
    const { h, existed } = await wrenHandle(step === 1);
    await append(h, step === 1 && existed ? '\n' + againText : text);
    disk.writes++;
    if (step === 1) {
      disk.lastModified = (await h.getFile()).lastModified;
      disk.stableTicks = 0;
      disk.lastAnswer = '';
    }
    return { ok: true };
  } catch (e) {
    let reason = e.name;
    if (e.name === 'NotFoundError') reason = step === 1 ? 'ForeignFolder' : 'Moved';
    disk.stopped = reason;
    if (reason === 'Moved') disk.fileFailed = true;
    return { ok: false, reason, line: STOP_LINES[reason] || null, moved: reason === 'Moved' };
  }
}

// The answer: text after the last "->", up to the next "====" line or the end.
export function parseAnswer(text) {
  const i = text.lastIndexOf('->');
  if (i < 0) return '';
  let rest = text.slice(i + 2);
  const end = rest.search(/\r?\n====/);
  if (end >= 0) rest = rest.slice(0, end);
  return rest.replace(/\s+/g, ' ').trim().slice(0, 60);
}

let failedPolls = 0;

// One poll tick. Returns { answer } once a saved answer has held for a tick,
// { moved: true } if the file is gone, or null.
export async function pollWren() {
  if (!disk.root || disk.stopped || disk.writes === 0) return null;
  try {
    const dir = await disk.root.getDirectoryHandle('Halcyon 95');
    const h = await dir.getFileHandle('WREN.TXT');
    const f = await h.getFile();
    failedPolls = 0;
    if (f.size > MAX) return null;
    if (f.lastModified !== disk.lastModified) {
      disk.lastModified = f.lastModified;
      disk.stableTicks = 0;
      return null;
    }
    if (++disk.stableTicks !== 1) return null;
    const answer = parseAnswer(await f.text());
    if (!answer || answer === disk.lastAnswer) return null;
    disk.lastAnswer = answer;
    return { answer };
  } catch {
    if (++failedPolls >= 3) {
      disk.stopped = 'Moved';
      disk.fileFailed = true;
      return { moved: true };
    }
    return null;
  }
}

// ---------- Safari and Firefox: a download, dragged or loaded back ----------

export function downloadWren(text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'WREN.TXT';
  a.click(); // never added to the DOM
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  disk.downloaded = true;
}

// Read a dropped or loaded file, only if it is really her file.
export async function readHerFile(file) {
  if (!/^wren.*\.txt$/i.test(file.name) || file.size > MAX) return { ok: false };
  if ((await readHead(file)) !== WREN_HEADER) return { ok: false };
  return { ok: true, answer: parseAnswer(await file.text()) };
}

// ---------- The end-card manifest ----------

export function manifest({ fileMode, notifications }) {
  const items = [];
  const remove = [];
  const f = disk.folderName;
  if (fileMode === 'folder' && disk.root) {
    if (disk.stopped && disk.stopped !== 'Moved' && !disk.madeFile) {
      items.push(`Nothing new on your disk. The game left the Halcyon 95 folder in "${f}" alone.`);
    } else if (disk.fileFailed) {
      items.push(`A folder named Halcyon 95 inside "${f}". It held WREN.TXT until you moved it.`);
    } else if (disk.madeFile || disk.madeDir) {
      items.push(`A folder named Halcyon 95 inside "${f}", with one file in it, WREN.TXT.`);
    }
    if (disk.madeDir || disk.madeFile) {
      remove.push("Drag the Halcyon 95 folder to the Trash (the Recycle Bin on Windows). If a WREN.TXT.crswap file is there too, it's from an interrupted save; it goes with the folder.");
    }
  } else if (fileMode === 'download' && disk.downloaded) {
    items.push('WREN.TXT in your Downloads folder. Your browser may have added a number to the name.');
    remove.push('Delete WREN.TXT from your Downloads folder.');
  }
  if (notifications) items.push(`${sent} notification${sent === 1 ? '' : 's'} from this site.`);
  if (!items.length) items.push('Nothing. Both options were off.');
  return { items, remove };
}

export function fileState() {
  return { folder: disk.folderName, madeFile: disk.madeFile, fileFailed: disk.fileFailed, stopped: disk.stopped, downloaded: !!disk.downloaded };
}
