import type { Entry } from "./entries";
import type { RegionId } from "./regions";

export type Suggestion = { key: string; region?: RegionId; level: "gentle" | "care" | "doctor" };

export function suggestions(entries: Entry[], scores: Partial<Record<RegionId, number>>): Suggestion[] {
  const out: Suggestion[] = [];
  const recent = entries.filter((e) => Date.now() - new Date(e.date).getTime() < 30 * 86400000);
  const has = (f: string) => recent.filter((e) => e.factors.includes(f as never)).length;
  for (const [region, s] of Object.entries(scores) as [RegionId, number][]) {
    const n = recent.filter((e) => e.region === region).length;
    const high = recent.some((e) => e.region === region && e.intensity >= 4);
    if (s > 1.6 || (n >= 3 && high)) out.push({ key: "doctor", region, level: "doctor" });
    else if (s > 0.8) {
      if (["kneeL","kneeR","hipL","hipR","lowerBack","shoulderL","shoulderR"].includes(region)) out.push({ key: "pt", region, level: "care" });
      else if (region === "head" || region === "neck") out.push({ key: "massage", region, level: "care" });
      else out.push({ key: "saltBath", region, level: "care" });
    }
  }
  if (recent.some((e) => e.region === "head") && has("lowWater")) out.push({ key: "water", level: "gentle" });
  if (has("period") >= 2) out.push({ key: "cycle", level: "gentle" });
  if (has("stress") >= 2) out.push({ key: "breath", level: "gentle" });
  return out;
}
