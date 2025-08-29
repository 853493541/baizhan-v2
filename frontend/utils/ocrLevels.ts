// utils/ocrLevels.ts
export type LevelBuckets = Record<number, string[]>; // 10..1

const cnToLevel: Record<string, number> = {
  "十": 10, "九": 9, "八": 8, "七": 7, "六": 6,
  "五": 5, "四": 4, "三": 3, "二": 2, "一": 1,
};
const levelMarkerRe = /^(十|九|八|七|六|五|四|三|二|一)重$/;

/** normalize: trim, collapse whitespace, remove fullwidth spaces */
function normalize(raw: string): string {
  return raw.replace(/\u3000/g, " ")
            .replace(/\s+/g, " ")
            .trim();
}

/** parse lines top→bottom into buckets (10..1) using headers like "十重" */
export function bucketizeByLevel(lines: string[]): LevelBuckets {
  const buckets: LevelBuckets = {};
  for (let L = 10; L >= 1; L--) buckets[L] = [];

  let currentLevel: number | null = null;

  for (const raw of lines) {
    const s = normalize(raw);
    if (!s) continue;

    const m = s.match(levelMarkerRe);
    if (m) {
      currentLevel = cnToLevel[m[1]];
      continue;
    }

    // ignore junk before first header
    if (!currentLevel) continue;

    // simple noise filter: ignore 1-char tokens that are often junk like "Y"
    if (s.length < 2) continue;

    buckets[currentLevel].push(s);
  }
  return buckets;
}
