import { useSyncExternalStore } from "react";

// Confirmation pop-ups ("Your reflection was saved.") appear centered in the
// viewport as a frosted-glass card. They exit when anything outside them is
// tapped, via their ✕, or after a few seconds.
export type StatusToast = { msg: string; id: number };

let toast: StatusToast | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function showStatus(msg: string) {
  toast = { msg, id: Date.now() };
  emit();
}
export function dismissStatus() { toast = null; emit(); }

const sub = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const SERVER: StatusToast | null = null;
export const useStatusToast = () => useSyncExternalStore(sub, () => toast, () => SERVER);
