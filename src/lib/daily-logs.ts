import { useSyncExternalStore } from "react";
import type { Mood } from "./journal";

// Standalone daily logs for the mind page — separate from journal entries.
// One record per day, upserted as the user types/toggles (device-local).
export type GratitudeDay = { date: string; items: string[] };
export type FeelingsDay = { date: string; moods: Mood[] };

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const today = () => new Date().toISOString().slice(0, 10);

function makeStore<T extends { date: string }>(KEY: string) {
  let cache: T[] | null = null;
  const read = (): T[] => {
    if (cache) return cache;
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) ?? "");
      cache = Array.isArray(raw) ? raw.filter((d) => d && typeof d.date === "string") : [];
    } catch { cache = []; }
    return cache!;
  };
  const write = (next: T[]) => {
    cache = next;
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage full */ }
    emit();
  };
  const upsertToday = (patch: (day: T | undefined) => T) => {
    const date = today();
    const list = read();
    const existing = list.find((d) => d.date === date);
    write(existing ? list.map((d) => (d.date === date ? patch(d) : d)) : [patch(undefined), ...list]);
  };
  const sub = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
  const useStore = () => useSyncExternalStore(sub, read, () => []);
  return { read, upsertToday, useStore };
}

const gratitudeStore = makeStore<GratitudeDay>("knowthyself.gratitude.v1");
const feelingsStore = makeStore<FeelingsDay>("knowthyself.feelings.v1");

export const useGratitude = gratitudeStore.useStore;
export const useFeelings = feelingsStore.useStore;
export const readGratitude = gratitudeStore.read;
export const readFeelings = feelingsStore.read;

export const setGratitudeToday = (items: string[]) => gratitudeStore.upsertToday((day) => ({ date: day?.date ?? today(), items }));
export const setFeelingsToday = (moods: Mood[]) => feelingsStore.upsertToday((day) => ({ date: day?.date ?? today(), moods }));
