import { useSyncExternalStore } from "react";

/** Chakra singing-bowl tones (root → crown), synthesized live with Web Audio; no audio files. */
export const CHAKRA_TONES = [396, 417, 528, 639, 741, 852, 963];
const KEY = "knowthyself.sound";
const PARTIALS: [number, number][] = [[1, 1], [2.76, 0.45], [5.4, 0.22], [8.93, 0.1]];
const GAP = 7; // seconds between bowls

type State = { on: boolean; volume: number };
let state: State = { on: false, volume: 0.5 };
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
let ctx: AudioContext | null = null, master: GainNode | null = null, timer: ReturnType<typeof setInterval> | null = null, step = 0;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? "{}"); if (typeof v.volume === "number") state = { ...state, volume: v.volume }; } catch { /* ignore */ }
}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ volume: state.volume })); } catch { /* ignore */ } };

function strike(freq: number) {
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  for (const [ratio, amp] of PARTIALS) {
    for (const detune of [-1.5, 1.5]) { // two close voices create the bowl's slow shimmer
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = freq * ratio * 0.5 + detune;
      const len = 9 / Math.sqrt(ratio);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(amp * 0.12, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(g).connect(master); o.start(t); o.stop(t + len + 0.1);
    }
  }
}
function start() {
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  ctx ??= new AC();
  if (!master) { master = ctx.createGain(); master.connect(ctx.destination); }
  master.gain.value = state.volume;
  void ctx.resume();
  const play = () => { strike(CHAKRA_TONES[step % CHAKRA_TONES.length]!); step++; };
  play(); timer = setInterval(play, GAP * 1000);
}
function stop() {
  if (timer) clearInterval(timer); timer = null;
  void ctx?.suspend();
}

/** Must be called from a click/tap so the browser allows audio. */
export function setSoundOn(on: boolean) { load(); if (on === state.on) return; state = { ...state, on }; on ? start() : stop(); emit(); }
export function setSoundVolume(volume: number) { load(); state = { ...state, volume }; if (master) master.gain.value = volume; save(); emit(); }
const sub = (l: () => void) => { load(); listeners.add(l); return () => { listeners.delete(l); }; };
const SERVER: State = { on: false, volume: 0.5 };
export const useSound = () => useSyncExternalStore(sub, () => state, () => SERVER);
