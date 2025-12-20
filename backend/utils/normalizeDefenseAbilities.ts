export function normalizeDefenseAbilities(char: any) {
  if (!char || !char.abilities) return;

  const isMap = typeof char.abilities.get === "function";

  const get = (name: string) =>
    Number(isMap ? char.abilities.get(name) : char.abilities[name] ?? 0);

  let changed = false;

  const setIfDifferent = (name: string, value: number) => {
    const current = get(name);
    if (current !== value) {
      console.log(
        `[normalizeDefense] ${name}: ${current} → ${value}`
      );

      if (isMap) char.abilities.set(name, value);
      else char.abilities[name] = value;

      changed = true;
    }
  };

  // =========================
  // One-to-one mappings
  // =========================
  const oneToOne: Array<[string, string]> = [
    ["鲨之息", "夜叉浮乐"],
    ["归潮长生法", "海龙御劲"],
    ["五行术土遁", "麒麟遁甲"],
    ["一刀柄锤", "一瞬柄撞"],
    ["枪法铁林", "铁猬"],
    ["角抵技巧", "俯阵熊突"],
    ["定波式", "逆波式"],
  ];

  for (const [src, def] of oneToOne) {
    setIfDifferent(def, get(src));
  }

  // =========================
  // Two-to-one mapping
  // =========================
  const target = Math.max(get("帝骖龙翔"), get("顽抗"));
  setIfDifferent("绝地反击", target);

  // 🔑 Only mark modified if something actually changed
  if (changed) {
    char.markModified("abilities");
  }
}
