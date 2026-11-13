import { useSyncExternalStore } from "react";
import type { Entry } from "./entries";

export const MOODS = ["calm","happy","grateful","confident","sad","angry","anxious","numb"] as const;
export type Mood = (typeof MOODS)[number];
export const HEAVY_MOODS: string[] = ["sad","angry","anxious","numb","overwhelmed"];

export type JournalEntry = { id: string; date: string; title?: string | undefined; text: string; gratitude: string[]; moods: Mood[]; image?: string | undefined; createdAt: number };

const KEY = "knowthyself.journal.v1";
const EMPTY: JournalEntry[] = [];
let cache: JournalEntry[] | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function read(): JournalEntry[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as JournalEntry[]) : [];
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

export type MindBody = { heavyPain: number | null; lightPain: number | null; gratefulPain: number | null; otherPain: number | null; gratitudeDays: number };
const avg = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
/** Compares average body intensity on days with heavy vs. lighter moods, and days with 3 nice things vs. others. */
export function mindBody(body: Entry[], journal: JournalEntry[]): MindBody {
  const byDay = new Map<string, number[]>();
  body.forEach((e) => byDay.set(e.date, [...(byDay.get(e.date) ?? []), e.intensity]));
  const pick = (f: (j: JournalEntry) => boolean) => journal.filter(f).flatMap((j) => byDay.get(j.date) ?? []);
  const isHeavy = (j: JournalEntry) => j.moods.some((m) => HEAVY_MOODS.includes(m));
  const isGrateful = (j: JournalEntry) => j.gratitude.filter((g) => g.trim()).length >= 3;
  return { heavyPain: avg(pick(isHeavy)), lightPain: avg(pick((j) => !isHeavy(j))), gratefulPain: avg(pick(isGrateful)), otherPain: avg(pick((j) => !isGrateful(j))), gratitudeDays: journal.filter(isGrateful).length };
}

/** All mind-diary entries currently loaded, for backups. */
export const journalSnapshot = () => read();
/** Restores mind-diary entries from a backup (merges by id). Returns how many were restored. */
export function restoreJournal(items: unknown[]): number {
  const ok = items.filter((x): x is JournalEntry => !!x && typeof (x as JournalEntry).id === "string" && typeof (x as JournalEntry).date === "string");
  ok.forEach((j) => saveJournal({ id: /^[0-9a-f-]{36}$/i.test(j.id) ? j.id : undefined, date: j.date, title: typeof j.title === "string" ? j.title : "", text: j.text ?? "", gratitude: Array.isArray(j.gratitude) ? j.gratitude : [], moods: Array.isArray(j.moods) ? j.moods : [], image: j.image }));
  return ok.length;
}
