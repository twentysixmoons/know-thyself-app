// The spirit-practice catalog. Practices are saved as real mind-diary entries
// (kind "practice") — see journal.ts. Chip colors run from #351969 (deep
// purple) to #691954 (pinkish) across the catalog.
export const PRACTICES = [
  "meditation", "yoga", "taiChi", "qiGong", "soundBath", "altarWork", "nature",
  "breathwork", "gardening", "divination", "skyGazing", "journaling",
  "cleansing", "singing", "dancing", "art",
] as const;
export type Practice = (typeof PRACTICES)[number];

/** Old ids from the first version of the catalog, mapped to the new ones. */
export const LEGACY_PRACTICE_MAP: Record<string, Practice> = {
  meditated: "meditation", altar: "altarWork", cleanedSpace: "cleansing", danced: "dancing",
};

/** Interpolated shade for a practice's position in the catalog. */
export function practiceShade(index: number, total = PRACTICES.length): string {
  const t = total <= 1 ? 0 : Math.min(1, Math.max(0, index / (total - 1)));
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);
  const r = lerp(0x35, 0x69), g = lerp(0x19, 0x19), b = lerp(0x69, 0x54);
  return `rgb(${r}, ${g}, ${b})`;
}

/** Translucent tint of a practice's shade (used as the pressed chip background). */
export function practiceTint(id: string): string {
  const c = practiceColor(id).match(/\d+/g)?.map(Number) ?? [53, 25, 105];
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, 0.12)`;
}

/** The catalog shade for a practice id (legacy ids resolve to their new one). */
export function practiceColor(id: string): string {
  const key = (LEGACY_PRACTICE_MAP[id] ?? id) as Practice;
  const index = PRACTICES.indexOf(key);
  return practiceShade(index < 0 ? 0 : index);
}
