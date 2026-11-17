import { useSyncExternalStore } from "react";

// Daily spirit practices ("Today I: …"). One record per day; toggling a pill
// upserts today's record. All device-local.
export const PRACTICES = [
  "meditated", "yoga", "taiChi", "qiGong", "soundBath", "altar", "nature",
  "breathwork", "gardening", "divination", "skyGazing", "journaling",
  "cleanedSpace", "art", "danced",
] as const;
export type Practice = (typeof PRACTICES)[number];
export type PracticeDay = { date: string; practices: Practice[] };

const KEY = "knowthyself.practices.v1";
const EMPTY: PracticeDay[] = [];
let cache: PracticeDay[] | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const today = () => new Date().toISOString().slice(0, 10);

function read(): PracticeDay[] {
  if (cache) return cache;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "");
    cache = Array.isArray(raw) ? raw.filter((d) => d && typeof d.date === "string" && Array.isArray(d.practices)) : [];
  } catch { cache = []; }
  return cache!;
}
function write(next: PracticeDay[]) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage full */ }
  emit();
}

const sub = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const usePractices = () => useSyncExternalStore(sub, read, () => EMPTY);

/** Toggle one practice for today's record and persist immediately. */
export function togglePractice(p: Practice): void {
  const date = today();
  const list = read();
  const day = list.find((d) => d.date === date);
  if (!day) {
    write([{ date, practices: [p] }, ...list]);
    return;
  }
  const practices = day.practices.includes(p) ? day.practices.filter((x) => x !== p) : [...day.practices, p];
  write(practices.length ? list.map((d) => (d.date === date ? { date, practices } : d)) : list.filter((d) => d.date !== date));
}

/** Replace the practices recorded for a specific date (used by the save button). */
export function setPracticesForDate(date: string, practices: Practice[]): void {
  const list = read();
  const existing = list.find((d) => d.date === date);
  write(existing ? list.map((d) => (d.date === date ? { date, practices } : d)) : [{ date, practices }, ...list]);
}

/** The practices recorded for a given date. */
export const practicesFor = (list: PracticeDay[], date: string): Practice[] => list.find((d) => d.date === date)?.practices ?? [];

/** Today's selected practices. */
export const todaysPractices = (list: PracticeDay[]): Practice[] => list.find((d) => d.date === today())?.practices ?? [];
