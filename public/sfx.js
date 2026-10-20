// All sound is synthesized with Web Audio (no sound files) and gets worse with
// the dread level. PAL's and Wren's voices use only the computer's local speech
// voices, so no text goes to an online speech service.

let ctx = null;
let master = null;
let humGain = null;
let muted = false;
let dread = 0;
let beatTimer = null;
let noise = null;

const HUM = [0.012, 0.02, 0.03, 0.042, 0.055, 0.07];
const BEAT_MS = [0, 0, 1500, 1150, 900, 700];

// Call from a click (the boot button): browsers start audio only after a gesture.
export function unlock() {
  if (ctx) { ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 1;
  master.connect(ctx.destination);
  noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  startHum();
}

function startHum() {
  humGain = ctx.createGain();
  humGain.gain.value = HUM[0];
  humGain.connect(master);
  for (const [f, g] of [[60, 1], [120, 0.5], [180, 0.15]]) {
    const o = ctx.createOscillator();
    const og = ctx.createGain();
    o.frequency.value = f;
    og.gain.value = g;
    o.connect(og).connect(humGain);
    o.start();
  }
  const n = ctx.createBufferSource();
  n.buffer = noise;
  n.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 7800;
  bp.Q.value = 6;
  const ng = ctx.createGain();
  ng.gain.value = 0.18;
  n.connect(bp).connect(ng).connect(humGain);
  n.start();
}

export function setDread(level) {
  dread = Math.max(0, Math.min(5, level));
  if (!ctx) return;
  humGain.gain.setTargetAtTime(HUM[dread], ctx.currentTime, 1.5);
  clearInterval(beatTimer);
  if (BEAT_MS[dread]) beatTimer = setInterval(heartbeat, BEAT_MS[dread]);
}

function thump(at, gain) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.setValueAtTime(70, at);
  o.frequency.exponentialRampToValueAtTime(38, at + 0.18);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
  o.connect(g).connect(master);
  o.start(at);
  o.stop(at + 0.25);
}

function heartbeat() {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  const g = 0.18 + dread * 0.06;
  thump(t, g);
  thump(t + 0.18, g * 0.7);
}

export function staticBurst(seconds = 0.6, gain = 0.12) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const n = ctx.createBufferSource();
  n.buffer = noise;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 1200;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.linearRampToValueAtTime(0, t + seconds);
  n.connect(hp).connect(g).connect(master);
  n.start(t, Math.random());
  n.stop(t + seconds);
}

// A dissonant swell for the big moments.
export function sting(level = 1) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.05 + level * 0.03, t + 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1400;
  g.connect(lp).connect(master);
  for (const f of [110, 116.5, 164.8, 233]) {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = f;
    o.connect(g);
    o.start(t);
    o.stop(t + 2.5);
  }
}

function blip(freq, dur, gain, type = 'square') {
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.01);
}

export const click = () => blip(1800, 0.025, 0.04);
export const tick = () => blip(2600 + Math.random() * 600, 0.012, 0.012);
export const errorBeep = () => { blip(440, 0.12, 0.05, 'square'); setTimeout(() => blip(330, 0.18, 0.05, 'square'), 130); };
export const chime = () => { blip(880, 0.15, 0.04, 'sine'); setTimeout(() => blip(1320, 0.25, 0.035, 'sine'), 120); };

export function setMuted(on) {
  muted = on;
  if (master) master.gain.setTargetAtTime(on ? 0 : 1, ctx.currentTime, 0.05);
  if (on && 'speechSynthesis' in window) speechSynthesis.cancel();
}
export const isMuted = () => muted;

// ---------- Voice: opt-in, local speech voices only ----------

let voiceOn = false;
export function setVoice(on) { voiceOn = on && 'speechSynthesis' in window; }
export const voiceEnabled = () => voiceOn;

function localVoice() {
  const vs = speechSynthesis.getVoices().filter((v) => v.localService && /^en/i.test(v.lang));
  return vs.find((v) => /samantha|daniel|karen|zira|david|aria/i.test(v.name)) || vs[0] || null;
}

export function speak(who, text) {
  if (!voiceOn || muted) return;
  const v = localVoice();
  if (!v) return; // never fall back to an online voice
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = v;
  if (who === 'wren') { u.rate = 0.72; u.pitch = 0.35; u.volume = 0.7; }
  else { u.rate = 1.05; u.pitch = 1.2; u.volume = 0.9; }
  speechSynthesis.speak(u);
}
