import { describe, expect, it } from "vitest";
import { mindBody, type JournalEntry } from "@/lib/journal";
import type { Entry } from "@/lib/entries";

const b = (date: string, intensity: number) => ({ id: date + intensity, date, region: "head", intensity, kind: "body", notes: "", factors: [], createdAt: 0 }) as Entry;
const j = (date: string, moods: string[], gratitude: string[] = []) => ({ id: date, date, text: "", moods, gratitude, createdAt: 0 }) as JournalEntry;

describe("mindBody", () => {
  it("averages body intensity on heavy-mood days vs lighter days", () => {
    const r = mindBody([b("2026-01-01", 5), b("2026-01-01", 3), b("2026-01-02", 1)], [j("2026-01-01", ["anxious"]), j("2026-01-02", ["calm"])]);
    expect(r.heavyPain).toBe(4);
    expect(r.lightPain).toBe(1);
  });
  it("counts a gratitude day only with 3 nice things", () => {
    const r = mindBody([b("2026-01-01", 2), b("2026-01-02", 4)], [j("2026-01-01", [], ["a", "b", "c"]), j("2026-01-02", [], ["a", "", ""])]);
    expect(r.gratitudeDays).toBe(1);
    expect(r.gratefulPain).toBe(2);
    expect(r.otherPain).toBe(4);
  });
});
