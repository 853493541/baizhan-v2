// app/utils/pinyinSearch.ts
// ✅ Unified tiny-pinyin helper — lazy-loaded, lightweight, and correct API.

let tinyPinyin: any;

/**
 * Dynamically import the tiny-pinyin library (cached after first load).
 * This ensures no large code is bundled into the first page load.
 */
async function getTiny() {
  if (!tinyPinyin) {
    const mod = await import("tiny-pinyin");
    tinyPinyin = (mod as any).default ?? mod;
  }
  return tinyPinyin;
}

/**
 * Build a map of full and short pinyin for a list of words.
 *
 * Example:
 *   createPinyinMap(["剑网三"])
 *   → { "剑网三": { full: "jianwangsan", short: "jws" } }
 */
export async function createPinyinMap(words: string[]) {
  const tp = await getTiny();
  const map: Record<string, { full: string; short: string }> = {};

  for (const w of words) {
    if (!w) continue;

    // tiny-pinyin uses `convertToPinyin` — separator allows clean syllables
    const dashed = tp.convertToPinyin(w, "-", true); // e.g. "jian-wang-san"
    const syllables = dashed.split("-");

    const full = syllables.join("");                      // → "jianwangsan"
   const short = syllables.map((s: string) => s[0] ?? "").join("");

    map[w] = { full, short };
  }

  return map;
}

/**
 * Filter a list of names by:
 *  - raw Chinese substring
 *  - full pinyin match
 *  - initials match
 */
export function pinyinFilter(
  list: string[],
  map: Record<string, { full: string; short: string }>,
  query: string
) {
  const q = query.toLowerCase();
  return list.filter((name) => {
    const entry = map[name];
    if (!entry) return name.includes(q); // fallback if map missing
    return (
      name.includes(q) ||
      entry.full.includes(q) ||
      entry.short.includes(q)
    );
  });
}

/**
 * Convert inline Chinese typing (e.g. search bar input)
 * to plain lowercase pinyin string.
 */
export async function hanziToPinyinInline(text: string) {
  const tp = await getTiny();
  return tp.convertToPinyin(text, "", true); // no separator, lowercase
}
