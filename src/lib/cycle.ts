import { useSyncExternalStore } from "react";

// Cycle tracking is strictly opt-in: it only starts after the user taps the
// menstruation button on the body tracker, and is stored on this device only.
const KEY = "knowthyself.cycle";
const listeners = new Set<() => void>();
let cache: boolean | null = null;
const read = (): boolean => {
  if (cache === null) {
    try { cache = localStorage.getItem(KEY) === "on"; } catch { cache = false; }
  }
  return cache;
};
export const setCycleTracking = (on: boolean) => {
  if (on === read()) return;
  cache = on;
  try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* storage full */ }
  listeners.forEach((l) => l());
};
export function useCycleTracking(): boolean {
  return useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, read, () => false);
}
