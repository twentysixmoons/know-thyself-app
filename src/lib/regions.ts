export type RegionId =
  | "head" | "neck" | "shoulderR" | "shoulderL" | "chest" | "stomach" | "lowerBack" | "pelvis"
  | "armR" | "armL" | "elbowR" | "elbowL" | "forearmR" | "forearmL" | "handR" | "handL" | "hipR" | "hipL" | "kneeR" | "kneeL" | "footR" | "footL";
// Coordinates in a 200x460 viewBox, mirror view: the body's left side is on the viewer's left.
export const REGIONS: { id: RegionId; x: number; y: number; r: number; side?: "L" | "R" }[] = [
  { id: "head", x: 100, y: 40, r: 30 },
  { id: "neck", x: 100, y: 70, r: 16 },
  { id: "shoulderR", x: 130, y: 92, r: 20, side: "R" },
  { id: "shoulderL", x: 70, y: 92, r: 20, side: "L" },
  { id: "chest", x: 100, y: 112, r: 28 },
  { id: "stomach", x: 100, y: 162, r: 28 },
  { id: "lowerBack", x: 100, y: 196, r: 22 },
  { id: "pelvis", x: 100, y: 228, r: 24 },
  { id: "armR", x: 145, y: 130, r: 16, side: "R" },
  { id: "armL", x: 55, y: 130, r: 16, side: "L" },
  { id: "elbowR", x: 152, y: 165, r: 14, side: "R" },
  { id: "elbowL", x: 48, y: 165, r: 14, side: "L" },
  { id: "forearmR", x: 159, y: 202, r: 15, side: "R" },
  { id: "forearmL", x: 41, y: 202, r: 15, side: "L" },
  { id: "handR", x: 166, y: 240, r: 16, side: "R" },
  { id: "handL", x: 34, y: 240, r: 16, side: "L" },
  { id: "hipR", x: 130, y: 225, r: 16, side: "R" },
  { id: "hipL", x: 70, y: 225, r: 16, side: "L" },
  { id: "kneeR", x: 123, y: 345, r: 20, side: "R" },
  { id: "kneeL", x: 77, y: 345, r: 20, side: "L" },
  { id: "footR", x: 118, y: 440, r: 18, side: "R" },
  { id: "footL", x: 82, y: 440, r: 18, side: "L" },
];
export function nearestRegion(x: number, y: number): RegionId {
  let best = REGIONS[0]!, bd = Infinity;
  for (const r of REGIONS) {
    if (r.id === "lowerBack") continue; // back is chosen from the list
    const dd = (r.x - x) ** 2 + (r.y - y) ** 2;
    if (dd < bd) { bd = dd; best = r; }
  }
  return best.id;
}

export type Chakra = "crown" | "throat" | "heart" | "solar" | "sacral" | "root";
/** Modern chakra color zone for each body region. */
export const CHAKRA: Record<RegionId, Chakra> = {
  head: "crown", neck: "throat",
  shoulderR: "heart", shoulderL: "heart", chest: "heart", armR: "heart", armL: "heart", elbowR: "heart", elbowL: "heart", forearmR: "heart", forearmL: "heart", handR: "heart", handL: "heart",
  stomach: "solar",
  lowerBack: "sacral", pelvis: "sacral", hipR: "sacral", hipL: "sacral",
  kneeR: "root", kneeL: "root", footR: "root", footL: "root",
};
export const CHAKRAS: Chakra[] = ["crown", "throat", "heart", "solar", "sacral", "root"];
