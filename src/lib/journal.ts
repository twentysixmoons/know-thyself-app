import { useSyncExternalStore } from "react";
import type { Entry } from "./entries";

export const MOODS = ["calm","happy","grateful","confident","sad","angry","anxious","numb","neutral"] as const;
export type Mood = (typeof MOODS)[number];
export const HEAVY_MOODS: string[] = ["sad","angry","anxious","numb","overwhelmed"];

/** A distinct pastel per mood, reused on the mind-card chips and the insights
 *  mood bar so the same mood is always the same color. Falls back to neutral. */
export const MOOD_COLORS: Record<string, string> = {
  calm: "oklch(0.88 0.07 200)",      // aqua
  happy: "oklch(0.9 0.1 95)",        // yellow
  grateful: "oklch(0.88 0.07 130)",  // soft green
  confident: "oklch(0.86 0.08 300)", // violet
  sad: "oklch(0.84 0.06 250)",       // blue
  angry: "oklch(0.86 0.09 25)",      // red
  anxious: "oklch(0.88 0.08 55)",    // orange
  numb: "oklch(0.87 0.005 85)",      // gray
  neutral: "oklch(0.91 0.02 90)",    // beige
  joyful: "oklch(0.87 0.1 75)",      // golden
  reflective: "oklch(0.85 0.06 280)",// indigo
  tired: "oklch(0.85 0.02 110)",     // muted khaki
  overwhelmed: "oklch(0.83 0.08 335)"// magenta
};
export const MOOD_NEUTRAL = "oklch(0.91 0.008 85)";

export const DREAM_TYPES = ["standard","lucid","nightmare","recurring","falseAwakening","vivid","progressive","prophetic"] as const;
export type DreamType = (typeof DREAM_TYPES)[number];
export type JournalKind = "daily" | "dream" | "gratitude" | "feelings";
/** Dream entries carry dreamTypes (multi-select)/symbols; daily entries carry
 *  text/image; gratitude and feelings entries carry their own lists. A missing
 *  kind means daily (older entries). */
export type JournalEntry = { id: string; date: string; kind?: JournalKind | undefined; title?: string | undefined; text: string; gratitude: string[]; moods: Mood[]; image?: string | undefined; dreamTypes?: DreamType[] | undefined; symbols?: string[] | undefined; createdAt: number };

const KEY = "knowthyself.journal.v1";
const EMPTY: JournalEntry[] = [];
let cache: JournalEntry[] | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function read(): JournalEntry[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    // Migrate legacy single dreamType records to the multi-select list.
    cache = raw ? (JSON.parse(raw) as JournalEntry[]).map((j) => ({ ...j, dreamTypes: Array.isArray(j.dreamTypes) ? j.dreamTypes : ((j as unknown as { dreamType?: DreamType }).dreamType ? [(j as unknown as { dreamType: DreamType }).dreamType] : []) })) : [];
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch { cache = []; }
  return cache!;
}
function write(next: JournalEntry[]) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage full */ }
  emit();
}

const sub = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const useJournal = () => useSyncExternalStore(sub, read, () => EMPTY);

export function saveJournal(e: Omit<JournalEntry, "id" | "createdAt"> & { id?: string | undefined }) {
  const cur = read();
  const prev = e.id ? cur.find((x) => x.id === e.id) : undefined;
  const n: JournalEntry = { ...e, id: e.id ?? crypto.randomUUID(), createdAt: prev?.createdAt ?? Date.now() };
  write(prev ? cur.map((x) => (x.id === n.id ? n : x)) : [n, ...cur]);
}
export function deleteJournal(id: string) {
  write(read().filter((x) => x.id !== id));
}
export function clearJournal() { write([]); }

export type MindBody = { heavyPain: number | null; lightPain: number | null; gratefulPain: number | null; otherPain: number | null; gratitudeDays: number };
const avg = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
/** Compares average body intensity on days with heavy vs. lighter moods, and days with 3 nice things vs. others. Dream entries are excluded (no moods/gratitude). */
export function mindBody(body: Entry[], journal: JournalEntry[]): MindBody {
  const byDay = new Map<string, number[]>();
  body.forEach((e) => byDay.set(e.date, [...(byDay.get(e.date) ?? []), e.intensity]));
  const daily = journal.filter((j) => j.kind !== "dream");
  const pick = (f: (j: JournalEntry) => boolean) => daily.filter(f).flatMap((j) => byDay.get(j.date) ?? []);
  const isHeavy = (j: JournalEntry) => j.moods.some((m) => HEAVY_MOODS.includes(m));
  const isGrateful = (j: JournalEntry) => j.gratitude.filter((g) => g.trim()).length >= 3;
  return { heavyPain: avg(pick(isHeavy)), lightPain: avg(pick((j) => !isHeavy(j))), gratefulPain: avg(pick(isGrateful)), otherPain: avg(pick((j) => !isGrateful(j))), gratitudeDays: daily.filter(isGrateful).length };
}

/** All mind-diary entries currently loaded, for backups. */
export const journalSnapshot = () => read();
/** Restores mind-diary entries from a backup (merges by id). Returns how many were restored. */
export function restoreJournal(items: unknown[]): number {
  const ok = items.filter((x): x is JournalEntry => !!x && typeof (x as JournalEntry).id === "string" && typeof (x as JournalEntry).date === "string");
  ok.forEach((j) => { const legacy = j as JournalEntry & { dreamType?: DreamType }; saveJournal({ id: /^[0-9a-f-]{36}$/i.test(j.id) ? j.id : undefined, date: j.date, kind: j.kind === "dream" ? "dream" : undefined, title: typeof j.title === "string" ? j.title : "", text: j.text ?? "", gratitude: Array.isArray(j.gratitude) ? j.gratitude : [], moods: Array.isArray(j.moods) ? j.moods : [], image: j.image, dreamTypes: Array.isArray(j.dreamTypes) ? j.dreamTypes.filter((d) => DREAM_TYPES.includes(d as DreamType)) : (legacy.dreamType && DREAM_TYPES.includes(legacy.dreamType) ? [legacy.dreamType] : []), symbols: Array.isArray(j.symbols) ? j.symbols.filter((s) => typeof s === "string") : undefined }); });
  return ok.length;
}
