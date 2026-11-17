import { useSyncExternalStore } from "react";

// Confirmation pop-ups ("✓ Saved.") appear over the location that was last
// clicked. They exit when anything outside them is tapped, and auto-dismiss
// after a few seconds.
export type StatusToast = { msg: string; x: number; y: number; id: number };

let toast: StatusToast | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const lastPoint = { x: 0, y: 0 };

if (typeof document !== "undefined") {
  // Capture every pointer press so a toast can anchor to the last click.
  document.addEventListener("pointerdown", (e) => { lastPoint.x = e.clientX; lastPoint.y = e.clientY; }, true);
}

export function showStatus(msg: string) {
  toast = { msg, x: lastPoint.x, y: lastPoint.y, id: Date.now() };
  emit();
}
export function dismissStatus() { toast = null; emit(); }

const sub = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const SERVER: StatusToast | null = null;
export const useStatusToast = () => useSyncExternalStore(sub, () => toast, () => SERVER);
