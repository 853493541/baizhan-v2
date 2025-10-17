import pinyin from "pinyin";

export function createPinyinMap(words: string[]) {
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

export function pinyinFilter(
  list: string[],
  map: Record<string, { full: string; short: string }>,
  query: string
) {
  const q = query.toLowerCase();
  return list.filter(
    (name) =>
      name.includes(q) ||
      map[name].full.includes(q) ||
      map[name].short.includes(q)
  );
}
