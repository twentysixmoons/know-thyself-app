// The spirit-practice catalog. Practices are saved as real mind-diary entries
// (kind "practice") — see journal.ts.
export const PRACTICES = [
  "meditated", "yoga", "taiChi", "qiGong", "soundBath", "altar", "nature",
  "breathwork", "gardening", "divination", "skyGazing", "journaling",
  "cleanedSpace", "art", "danced",
] as const;
export type Practice = (typeof PRACTICES)[number];
