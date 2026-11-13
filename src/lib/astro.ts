// Approximate sun & moon positions and moon phase. Accurate to ~1°.
// mode "sidereal" subtracts the Lahiri ayanamsa from the tropical longitudes;
// mode "tropical" reads the signs directly. Phase/illumination are mode-independent.
import { useSyncExternalStore } from "react";

const rad = Math.PI / 180;
const norm = (x: number) => ((x % 360) + 360) % 360;
export const SIGNS = ["aries","taurus","gemini","cancer","leo","virgo","libra","scorpio","sagittarius","capricorn","aquarius","pisces"] as const;
export const SIGN_GLYPH: Record<string, string> = { aries: "♈\uFE0E", taurus: "♉\uFE0E", gemini: "♊\uFE0E", cancer: "♋\uFE0E", leo: "♌\uFE0E", virgo: "♍\uFE0E", libra: "♎\uFE0E", scorpio: "♏\uFE0E", sagittarius: "♐\uFE0E", capricorn: "♑\uFE0E", aquarius: "♒\uFE0E", pisces: "♓\uFE0E" };
export type Sign = (typeof SIGNS)[number];
export const PHASES = ["new","waxingCrescent","firstQuarter","waxingGibbous","full","waningGibbous","lastQuarter","waningCrescent"] as const;
export type Phase = (typeof PHASES)[number];

export type ZodiacMode = "sidereal" | "tropical";
const ZODIAC_KEY = "knowthyself.zodiac";
const zodiacListeners = new Set<() => void>();
let zodiacCache: ZodiacMode | null = null;
const readZodiac = (): ZodiacMode => {
  if (zodiacCache) return zodiacCache;
  try { const v = localStorage.getItem(ZODIAC_KEY); zodiacCache = v === "tropical" ? "tropical" : "sidereal"; } catch { zodiacCache = "sidereal"; }
  return zodiacCache;
};
/** Persisted choice of zodiac system; defaults to sidereal (Lahiri). */
export const setZodiac = (m: ZodiacMode) => {
  if (m === readZodiac()) return;
  zodiacCache = m;
  try { localStorage.setItem(ZODIAC_KEY, m); } catch { /* storage full */ }
  zodiacListeners.forEach((l) => l());
};
export function useZodiac(): ZodiacMode {
  return useSyncExternalStore((l) => { zodiacListeners.add(l); return () => { zodiacListeners.delete(l); }; }, readZodiac, () => "sidereal");
}

/** Geocentric tropical sun & moon longitudes (low precision, ~1°). */
function lumis(d: number) {
  const g = norm(357.528 + 0.9856003 * d);
  const sun = norm(280.46 + 0.9856474 * d + 1.915 * Math.sin(g * rad) + 0.02 * Math.sin(2 * g * rad));
  const L0 = norm(218.316 + 13.176396 * d);
  const M = norm(134.963 + 13.064993 * d);
  const D = norm(297.85 + 12.190749 * d);
  const moon = norm(L0 + 6.289 * Math.sin(M * rad) + 1.274 * Math.sin((2 * D - M) * rad) + 0.658 * Math.sin(2 * D * rad));
  return { sun, moon };
}

export function astroFor(date: Date, mode: ZodiacMode = "sidereal") {
  const d = date.getTime() / 86400000 + 2440587.5 - 2451545;
  const { sun, moon } = lumis(d);
  const ayan = mode === "tropical" ? 0 : 23.853 + (d / 365.25) * 0.013969;
  const elong = norm(moon - sun);
  const F = norm(93.272 + 13.22935 * d);
  const nearNode = Math.min(F % 180, 180 - (F % 180)) < 15;
  const phase: Phase = PHASES[Math.floor(norm(elong + 22.5) / 45) % 8]!;
  return {
    sunSign: SIGNS[Math.floor(norm(sun - ayan) / 30)]!,
    moonSign: SIGNS[Math.floor(norm(moon - ayan) / 30)]!,
    phase,
    illumination: (1 - Math.cos(elong * rad)) / 2,
    waxing: elong < 180,
    solarEclipse: nearNode && (elong < 12 || elong > 348),
  };
}

export type MoonTarget = "new" | "full";
/** Days until the next new or full moon, whichever comes first (synodic rate ≈ 12.19°/day). */
export function nextMoonEvent(date = new Date()): { target: MoonTarget; days: number } {
  const d = date.getTime() / 86400000 + 2440587.5 - 2451545;
  const { sun, moon } = lumis(d);
  const elong = norm(moon - sun);
  const toFull = (elong < 180 ? 180 - elong : 540 - elong) / 12.190749;
  const toNew = (360 - elong) / 12.190749;
  return toFull <= toNew ? { target: "full", days: toFull } : { target: "new", days: toNew };
}
