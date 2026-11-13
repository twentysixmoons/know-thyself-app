import { useSyncExternalStore } from "react";
import type { RegionId } from "./regions";
import { astroFor, type Phase } from "./astro";

export const FACTORS = ["alcohol","poorSleep","period","stress","lowWater","fall","exercise","meditation"] as const;
export type Factor = (typeof FACTORS)[number];
export const KINDS = ["body","mind","spirit"] as const;
export type Kind = (typeof KINDS)[number];

export type Entry = {
  id: string; date: string; region: RegionId; intensity: number; kind: Kind;
  notes: string; factors: Factor[]; image?: string | undefined; createdAt: number;
};

const KEY = "knowthyself.entries.v2";
const OLD_KEY = "knowthyself.entries.v1";
/** Old notes used 0-10; convert to the 1-5 intensity scale. */
const toFive = (n: number) => Math.min(5, Math.max(1, Math.round(n / 2)));
const EMPTY: Entry[] = [];
let cache: Entry[] | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
function seed(): Entry[] {
  const s: Omit<Entry, "id" | "createdAt">[] = [
    { date: daysAgo(1), region: "kneeL", intensity: 3, kind: "body", notes: "Slipped on the garden steps. Bruise forming, stiff when bending.", factors: ["fall","alcohol"] },
    { date: daysAgo(4), region: "head", intensity: 2, kind: "body", notes: "Dull headache behind the eyes all afternoon, dry mouth.", factors: ["lowWater","poorSleep"] },
    { date: daysAgo(9), region: "pelvis", intensity: 4, kind: "body", notes: "Cramping, heavy and low. Heat pad helped a little.", factors: ["period"] },
    { date: daysAgo(12), region: "chest", intensity: 2, kind: "spirit", notes: "Heaviness in the heart after a hard conversation. Journaled and lit a candle.", factors: ["stress","meditation"] },
    { date: daysAgo(15), region: "kneeL", intensity: 2, kind: "body", notes: "Same knee aching after a long walk.", factors: ["exercise"] },
    { date: daysAgo(20), region: "head", intensity: 3, kind: "body", notes: "Tension headache, jaw clenched.", factors: ["stress","lowWater"] },
    { date: daysAgo(37), region: "pelvis", intensity: 4, kind: "body", notes: "Period pain, lower back too.", factors: ["period"] },
    { date: daysAgo(38), region: "lowerBack", intensity: 3, kind: "body", notes: "Lower back throbbing with the cramps.", factors: ["period"] },
    { date: daysAgo(26), region: "shoulderL", intensity: 2, kind: "mind", notes: "Carrying worry in my shoulders.", factors: ["stress"] },
  ];
  return s.map((e, i) => ({ ...e, id: `seed-${i}`, createdAt: Date.now() - i }));
}
function readLocal(): Entry[] {
  if (cache) return cache;
  try { const raw = localStorage.getItem(KEY); if (raw) cache = JSON.parse(raw);
    else {
      const old = localStorage.getItem(OLD_KEY);
      cache = old ? (JSON.parse(old) as Entry[]).map((e) => ({ ...e, intensity: toFive(e.intensity) })) : seed();
      localStorage.setItem(KEY, JSON.stringify(cache));
    } } catch { cache = seed(); }
  return cache!;
}
function writeLocal(next: Entry[]) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage full */ }
  emit();
}

export function useEntries() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, readLocal, () => EMPTY);
}

export function saveEntry(e: Omit<Entry, "id" | "createdAt"> & { id?: string | undefined }) {
  const list = readLocal();
  if (e.id) {
    const updated = { ...list.find((x) => x.id === e.id)!, ...e } as Entry;
    writeLocal(list.map((x) => (x.id === e.id ? updated : x)));
  } else {
    const n = { ...e, id: crypto.randomUUID(), createdAt: Date.now() } as Entry;
    writeLocal([n, ...list]);
  }
}
export function deleteEntry(id: string) { writeLocal(readLocal().filter((x) => x.id !== id)); }

/** Recency-weighted attention score per region: each entry adds intensity/5, fading over ~30 days. */
export function regionScores(entries: Entry[], now = new Date()) {
  const out: Partial<Record<RegionId, number>> = {};
  for (const e of entries) {
    const age = Math.max(0, (now.getTime() - new Date(e.date + "T12:00").getTime()) / 86400000);
    out[e.region] = (out[e.region] ?? 0) + (e.intensity / 5) * Math.exp(-age / 30);
  }
  return out;
}
export const phaseOf = (e: Entry): Phase => astroFor(new Date(e.date + "T12:00")).phase;
export const sortByDate = (l: Entry[]) => [...l].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

/** Full backup: body notes plus mind-diary entries. */
export function exportEntries(journal: unknown[] = []) {
  const blob = new Blob([JSON.stringify({ app: "know-thyself", version: 2, body: readLocal(), journal }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `know-thyself-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
/** Accepts new full backups ({ body, journal }) and older body-only arrays. */
export async function importEntries(file: File, restoreJournal?: (items: unknown[]) => number): Promise<number> {
  const raw = JSON.parse(await file.text());
  const data = Array.isArray(raw) ? raw : raw?.body;
  if (!Array.isArray(data)) throw new Error("bad");
  const mind = !Array.isArray(raw) && Array.isArray(raw?.journal) && restoreJournal ? restoreJournal(raw.journal) : 0;
  const ok = data.filter((x) => x && typeof x.id === "string" && typeof x.date === "string" && typeof x.region === "string");
  const byId = new Map(readLocal().map((x) => [x.id, x]));
  const uuid = /^[0-9a-f-]{36}$/i;
  const items = (ok as Entry[]).map((x) => (uuid.test(x.id) ? x : { ...x, id: crypto.randomUUID() }));
  items.forEach((x) => byId.set(x.id, x));
  writeLocal([...byId.values()]);
  return ok.length + mind;
}
