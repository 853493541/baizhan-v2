// utils/ocrLevels.ts
export type LevelBuckets = Record<number, string[]>; // 10..1

const cnToLevel: Record<string, number> = {
  十: 10, 九: 9, 八: 8, 七: 7, 六: 6, 五: 5, 四: 4, 三: 3, 二: 2, 一: 1,
};
const levelMarkerRe = /^(十|九|八|七|六|五|四|三|二|一)重$/;

/** normalize: trim, collapse whitespace, remove fullwidth spaces */
function normalize(raw: string): string {
  return raw.replace(/\u3000/g, " ").replace(/\s+/g, " ").trim();
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

    if (!currentLevel) continue; // ignore anything before first header
    if (s.length < 2) continue;  // drop obvious junk like "Y"

    buckets[currentLevel].push(s);
  }
  return buckets;
}

/** split an array into N near-equal columns (for screenshot-like layout) */
export function splitIntoColumns<T>(arr: T[], columns: number): T[][] {
  if (columns <= 1) return [arr];
  const out: T[][] = Array.from({ length: columns }, () => []);
  const target = Math.ceil(arr.length / columns);
  for (let i = 0; i < arr.length; i++) {
    const col = Math.floor(i / target);
    out[Math.min(col, columns - 1)].push(arr[i]);
  }
  return out;
}
