// Synthesized sound effects (Web Audio API only, zero audio files).
// import { play, setMuted, unlockAudio } from './audio/sounds.js'
// Call unlockAudio() inside the first user tap (browsers block audio until then).
let ctx = null;
let master = null;
let muted = false;
let ambientTimer = null;
const VOLUME = 0.7;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : VOLUME;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
export function unlockAudio() { ac(); }
export function setMuted(m) { muted = !!m; if (master) master.gain.value = muted ? 0 : VOLUME; }
export function isMuted() { return muted; }

function tone(freq, start, dur, o = {}) {
  const c = ac();
  if (!c || muted) return;
  const { type = 'sine', gain = 0.25, slideTo = null, attack = 0.006, vibrato = 0, vibratoRate = 6 } = o;
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  if (vibrato) {
    const lfo = c.createOscillator(), lg = c.createGain();
    lfo.frequency.value = vibratoRate; lg.gain.value = vibrato;
    lfo.connect(lg); lg.connect(osc.frequency); lfo.start(t0); lfo.stop(t0 + dur + 0.03);
  }
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(master);
  osc.start(t0); osc.stop(t0 + dur + 0.03);
}

function noise(start, dur, o = {}) {
  const c = ac();
  if (!c || muted) return;
  const { gain = 0.15, type = 'bandpass', freq = 1000, freqTo = null, q = 1 } = o;
  const t0 = c.currentTime + start;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(freq, t0);
  if (freqTo) f.frequency.exponentialRampToValueAtTime(freqTo, t0 + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(master);
  src.start(t0); src.stop(t0 + dur + 0.03);
}

const NOTE = { C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5, G6: 1568 };
const metal = (s, f = 2600) => { tone(f, s, 0.06, { type: 'triangle', gain: 0.16 }); tone(f * 1.48, s, 0.04, { gain: 0.08 }); };
const clink = (s, j = 1) => { tone(2093 * j, s, 0.14, { gain: 0.15 }); tone(3136 * j, s, 0.09, { gain: 0.08 }); tone(1568 * j, s + 0.06, 0.18, { type: 'triangle', gain: 0.1 }); };
const fanfare = () => {
  [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((f, i) => tone(f, i * 0.12, 0.3, { type: 'triangle', gain: 0.24 }));
  [NOTE.C6, NOTE.G5, NOTE.E6].forEach((f, i) => tone(f, 0.55 + i * 0.1, 0.4, { gain: 0.12 }));
};
const sad = () => [NOTE.A4, NOTE.F4, NOTE.D4].forEach((f, i) => tone(f, i * 0.22, 0.42, { type: 'triangle', gain: 0.2 }));
const COMMON = {
  click: () => tone(900, 0, 0.05, { type: 'square', gain: 0.06 }),
  tick: () => tone(1250, 0, 0.03, { type: 'square', gain: 0.045 }),
  card: () => noise(0, 0.14, { freq: 1800, freqTo: 4000, gain: 0.12, q: 0.7 }),
  pop: () => tone(520, 0, 0.09, { gain: 0.2, slideTo: 980 }),
  invalid: () => tone(170, 0, 0.18, { type: 'square', gain: 0.1, slideTo: 110 }),
  win: fanfare,
  lose: sad,
};

const GAME = {
  // Bantay barks twice
  kahol: () => [0, 0.22].forEach((s) => { noise(s, 0.12, { freq: 700, gain: 0.25, q: 2 }); tone(340, s, 0.12, { type: 'sawtooth', gain: 0.12, slideTo: 210 }); }),
  // Muning meows
  ngiyaw: () => { tone(520, 0, 0.55, { gain: 0.16, slideTo: 760, vibrato: 12, vibratoRate: 7 }); tone(760, 0.3, 0.35, { gain: 0.12, slideTo: 430 }); },
  // Kikay clucks
  putak: () => [0, 0.12, 0.22, 0.42].forEach((s, i) => tone(i === 3 ? 900 : 720, s, i === 3 ? 0.18 : 0.07, { type: 'square', gain: 0.06, slideTo: i === 3 ? 600 : 560 })),
  // searching the grass / bushes
  kaluskos: () => { for (let i = 0; i < 4; i++) noise(i * 0.09, 0.12, { freq: 2500 + Math.random() * 1500, gain: 0.12, q: 0.8 }); },
  // footprints found (soft taps)
  bakas: () => [0, 0.14, 0.28].forEach((s) => tone(240, s, 0.07, { type: 'triangle', gain: 0.18, slideTo: 180 })),
  wala: () => tone(300, 0, 0.25, { type: 'triangle', gain: 0.14, slideTo: 200 }),
  tanong: () => [NOTE.C5, NOTE.G5].forEach((f, i) => tone(f, i * 0.08, 0.14, { gain: 0.16 })),
  oo: () => [NOTE.E5, NOTE.A5].forEach((f, i) => tone(f, i * 0.09, 0.2, { type: 'triangle', gain: 0.18 })),
  hindi: () => [NOTE.A4, NOTE.E4].forEach((f, i) => tone(f, i * 0.1, 0.22, { type: 'triangle', gain: 0.16 })),
  mainit: () => [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((f, i) => tone(f, i * 0.06, 0.18, { type: 'triangle', gain: 0.16 })),
  maligamgam: () => [NOTE.E5, NOTE.G5].forEach((f, i) => tone(f, i * 0.09, 0.2, { gain: 0.15 })),
  malamig: () => [NOTE.C6, NOTE.G5, NOTE.E5].forEach((f, i) => tone(f, i * 0.09, 0.3, { gain: 0.12 })),
  orasan: () => { tone(1500, 0, 0.04, { type: 'square', gain: 0.05 }); tone(1100, 0.25, 0.04, { type: 'square', gain: 0.05 }); },
  takipsilim: () => [NOTE.A4, NOTE.E4, NOTE.C4].forEach((f) => tone(f, 0, 1.4, { type: 'triangle', gain: 0.1 })),
  nahanap: () => { [NOTE.G5, NOTE.C6, NOTE.E6].forEach((f, i) => tone(f, i * 0.08, 0.25, { type: 'triangle', gain: 0.18 })); },
};
// ambience: birds and crickets
const AMBIENT = () => (Math.random() < 0.6 ? [0, 0.09].forEach((s) => tone(2600 + Math.random() * 600, s, 0.06, { gain: 0.02, slideTo: 3400 })) : tone(4200, 0, 0.25, { type: 'square', gain: 0.006, vibrato: 300, vibratoRate: 40 }));

const sfx = { ...COMMON, ...GAME };
export const SOUND_NAMES = Object.keys(sfx);
export function play(name) { if (!muted && sfx[name]) sfx[name](); }
export { sfx };

/** Very quiet background ambience (AMBIENT below). Off by default; let the player turn it on. */
export function startAmbient() {
  if (ambientTimer) return;
  ac();
  const next = () => { if (!muted && ctx) AMBIENT(); ambientTimer = setTimeout(next, 1400 + Math.random() * 2600); };
  ambientTimer = setTimeout(next, 600);
}
export function stopAmbient() { if (ambientTimer) { clearTimeout(ambientTimer); ambientTimer = null; } }
