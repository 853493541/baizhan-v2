// app/utils/pinyinSearch.ts
// ✅ Lazy-loads pinyin only when needed, instead of bundling it into every page.

let pinyinModule: any;

/**
 * Dynamically import the heavy `pinyin` library once and cache it.
 */
async function getPinyin() {
  if (!pinyinModule) {
    const mod = await import("pinyin");
    pinyinModule = mod.default || mod;
  }
  return pinyinModule;
}

/**
 * Create a map of full and short pinyin spellings for a list of words.
 * Example output: { 剑网三: { full: "jianwangsan", short: "jws" } }
 */
export async function createPinyinMap(words: string[]) {
  const pinyin = await getPinyin();
  const map: Record<string, { full: string; short: string }> = {};

  for (const w of words) {
    const full = pinyin(w, { style: pinyin.STYLE_NORMAL })
      .flat()
      .join("");
    const short = pinyin(w, { style: pinyin.STYLE_FIRST_LETTER })
      .flat()
      .join("");
    map[w] = { full, short };
  }

  return map;
}

/**
 * Filter a list of names by Chinese characters, full pinyin, or initials.
 * Uses the map produced by createPinyinMap().
 */
export function pinyinFilter(
  list: string[],
  map: Record<string, { full: string; short: string }>,
  query: string
) {
  const q = query.toLowerCase();
  return list.filter((name) => {
    const entry = map[name];
    if (!entry) return false;
    return (
      name.includes(q) ||
      entry.full.includes(q) ||
      entry.short.includes(q)
    );
  });
}
