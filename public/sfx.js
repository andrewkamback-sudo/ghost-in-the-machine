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

// Levels are tuned for laptop speakers, which can't play much below ~150 Hz.
const HUM = [0.02, 0.03, 0.04, 0.055, 0.07, 0.09];
let analyser = null;
const BEAT_MS = [0, 0, 1500, 1150, 900, 700];

// Call from a click (the boot button): browsers start audio only after a gesture.
export function unlock() {
  if (ctx) { ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 1;
  // A compressor plus makeup gain makes everything loud on small speakers without clipping when sounds stack.
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -30;
  comp.ratio.value = 6;
  const makeup = ctx.createGain();
  makeup.gain.value = 2.2;
  analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  master.connect(comp).connect(makeup).connect(analyser).connect(ctx.destination);
  // Some browsers start the context suspended; any later click or key wakes it.
  const wake = () => { if (ctx.state !== 'running') ctx.resume(); };
  addEventListener('pointerdown', wake);
  addEventListener('keydown', wake);
  noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  startHum();
}

function startHum() {
  humGain = ctx.createGain();
  humGain.gain.value = HUM[0];
  humGain.connect(master);
  // A buzzing sawtooth: its harmonics (240-900 Hz) are what laptop speakers can actually play.
  const saw = ctx.createOscillator();
  saw.type = 'sawtooth';
  saw.frequency.value = 120;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 900;
  saw.connect(lp).connect(humGain);
  saw.start();
  const sub = ctx.createOscillator();
  sub.frequency.value = 60;
  const sg = ctx.createGain();
  sg.gain.value = 0.5;
  sub.connect(sg).connect(humGain);
  sub.start();
  const n = ctx.createBufferSource();
  n.buffer = noise;
  n.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 3200;
  bp.Q.value = 1.2;
  const ng = ctx.createGain();
  ng.gain.value = 0.35;
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

// The end card and closing the tab: hum and heartbeat fade out; Boot again's setDread brings them back.
export function fadeOut(seconds = 2) {
  clearInterval(beatTimer);
  if (ctx) humGain.gain.setTargetAtTime(0, ctx.currentTime, seconds / 4);
}
// Speech can outlive a closed tab, so cancel it; a page kept in the back/forward cache only pauses.
addEventListener('pagehide', (e) => {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  if (ctx) e.persisted ? ctx.suspend() : ctx.close();
});

function thump(at, gain) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.24);
  g.connect(master);
  for (const [f0, f1, type] of [[90, 50, 'sine'], [180, 100, 'triangle'], [270, 150, 'sine']]) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, at);
    o.frequency.exponentialRampToValueAtTime(f1, at + 0.2);
    o.connect(g);
    o.start(at);
    o.stop(at + 0.26);
  }
}

function heartbeat() {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  const g = 0.35 + dread * 0.08;
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
  g.gain.setValueAtTime(gain * 1.6, t);
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
  g.gain.exponentialRampToValueAtTime(0.12 + level * 0.05, t + 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2200;
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

export const click = () => blip(1800, 0.03, 0.08);
export const tick = () => blip(2400 + Math.random() * 600, 0.015, 0.035);
export const errorBeep = () => { blip(440, 0.12, 0.12, 'square'); setTimeout(() => blip(330, 0.18, 0.12, 'square'), 130); };
export const chime = () => { blip(880, 0.15, 0.1, 'sine'); setTimeout(() => blip(1320, 0.25, 0.09, 'sine'), 120); };

// A Halcyon 95 startup sound when the desktop appears, so players know sound is on.
export function startup() {
  if (!ctx) return;
  [[523, 0], [659, 0.18], [784, 0.36], [1046, 0.6]].forEach(([f, d]) => setTimeout(() => blip(f, 0.5, 0.09, 'triangle'), d * 1000));
}

// For the ~ trace and the tests: is audio running, and how loud is it right now?
export function debug() {
  if (!analyser) return { state: 'none', rms: 0 };
  const buf = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buf);
  const rms = Math.sqrt(buf.reduce((a, x) => a + x * x, 0) / buf.length);
  return { state: ctx.state, muted, dread, rms: Math.round(rms * 1000) / 1000 };
}

export function setMuted(on) {
  if (muted && !on) setTimeout(chime, 80);
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
