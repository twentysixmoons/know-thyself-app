// Gentle-suggestion queue: at most 4 cards visible at a time. A dismissed card
// frees a slot, and the next waiting card only fills it 3 hours later (kept in
// localStorage so the timing survives reloads).
const KEY = "knowthyself.sugg.v1";
const THREE_H = 3 * 60 * 60 * 1000;
const MAX_VISIBLE = 4;

export type SuggQueue = { active: string[]; pending: string[]; hidden: string[]; nextPromote: number };

function fresh(allIds: string[]): SuggQueue {
  return { active: allIds.slice(0, MAX_VISIBLE), pending: allIds.slice(MAX_VISIBLE), hidden: [], nextPromote: 0 };
}
function read(): SuggQueue | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "");
    if (s && Array.isArray(s.active) && Array.isArray(s.pending) && Array.isArray(s.hidden)) {
      return { active: s.active, pending: s.pending, hidden: s.hidden, nextPromote: Number(s.nextPromote) || 0 };
    }
  } catch { /* fresh start */ }
  return null;
}
function write(s: SuggQueue) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage full */ }
}

/** Sync the queue with the suggestions the data currently produces, then fill
 *  one open slot — but only if 3 hours have passed since the last slot opened. */
export function tickSugg(allIds: string[]): SuggQueue {
  let stored = read();
  const s = stored ?? fresh(allIds);
  const known = new Set(allIds);
  const active = s.active.filter((id) => known.has(id));
  const hidden = s.hidden.filter((id) => known.has(id));
  const pending: string[] = [];
  for (const id of s.pending) if (known.has(id) && !active.includes(id)) pending.push(id);
  for (const id of allIds) if (!active.includes(id) && !pending.includes(id) && !hidden.includes(id)) pending.push(id);
  const next: SuggQueue = { active, pending, hidden, nextPromote: s.nextPromote };
  if (next.active.length < MAX_VISIBLE && next.pending.length > 0 && Date.now() >= next.nextPromote) {
    next.active.push(next.pending.shift()!);
    next.nextPromote = Date.now() + THREE_H;
  }
  if (!stored || JSON.stringify(next) !== JSON.stringify(s)) write(next);
  return next;
}

/** Hide a card and open a slot; the replacement card waits 3 hours. */
export function dismissSugg(id: string): SuggQueue {
  const s = read() ?? { active: [], pending: [], hidden: [], nextPromote: 0 };
  const next: SuggQueue = { ...s, active: s.active.filter((x) => x !== id), hidden: [...s.hidden, id], nextPromote: Date.now() + THREE_H };
  write(next);
  return next;
}
