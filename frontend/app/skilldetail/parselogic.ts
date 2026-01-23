/* =========================================
   Skill description structuring logic
   ADD:
   - Detect DAMAGE TYPE (打击类型)
   - ONLY based on explicit:
       "耐力打击"
       "精神打击"
   - NOT cost, NOT damage element
   - Detect UNCATALOG TAGS (临时未归类标签)
       当前包含：
       - 打断
       - 驱友（恢复/回复 + 驱散/卸除）
========================================= */

export type ResourceTag = "耗精" | "耗耐";
export type DamageTag = "打耐" | "打精";
export type UncatalogTag = "打断" | "驱友";

// ✅ Merge unit into existing <span class="num">
function highlightNumberWithUnit(html: string): string {
  return html.replace(
    /<span class="num">(\d+(?:\.\d+)?)<\/span>(万|亿)/g,
    `<span class="num">$1$2</span>`
  );
}

export interface ParsedSkill {
  name: string;
  baseHtml: string;
  specialBlocks: string[];
  resourceTags: ResourceTag[];
  damageTags: DamageTag[];
  uncatalogTags: UncatalogTag[];
}

/** OG rule: <a/b/c> → level 8 / 9 / 10 */
function levelToIndex(level: number): number {
  if (level >= 10) return 2;
  if (level >= 9) return 1;
  return 0;
}

/**
 * SPECIAL condition extraction
 */
function isSpecialCondition(sentence: string): boolean {
  return (
    sentence.includes("招式到达") ||
    sentence.includes("招式达到") ||
    sentence.includes("完成度到达") ||

    // sentence.includes("该招式使用者为") ||
    sentence.includes("当门派") ||
    sentence.includes("门派为") ||
    sentence.includes("心法为") ||
    sentence.includes("治疗心法") ||
    sentence.includes("兵器为")
  );
}

/**
 * Detect EXPLICIT COSTS ONLY
 */
function detectResourceTags(html: string): ResourceTag[] {
  const tags = new Set<ResourceTag>();

  const starts: number[] = [];
  let pos = 0;
  while (true) {
    const i = html.indexOf("消耗", pos);
    if (i === -1) break;
    starts.push(i);
    pos = i + 2;
  }

  const separators = ["，", "。", "；", "\n"];

  for (const start of starts) {
    let end = html.length;
    for (const sep of separators) {
      const j = html.indexOf(sep, start);
      if (j !== -1 && j < end) end = j;
    }
    const clause = html.slice(start, end);

    // ✅ 耗精神：必须包含“点精神”，但不能是“点精神打击”
    if (
      clause.includes("点精神") &&
      !clause.includes("点精神打击")
    ) {
      tags.add("耗精");
    }

    // ✅ 耗耐力：必须包含“点耐力”，但不能是“点耐力打击”
    if (
      clause.includes("点耐力") &&
      !clause.includes("点耐力打击")
    ) {
      tags.add("耗耐");
    }
  }

  return Array.from(tags);
}

/**
 * Detect DAMAGE TYPE (打击类型)
 * Rule:
 * - ONLY look for literal "耐力打击" / "精神打击"
 * - Count anywhere in base description
 */
function detectDamageTags(html: string): DamageTag[] {
  const tags = new Set<DamageTag>();

  if (html.includes("耐力打击")) tags.add("打耐");
  if (html.includes("精神打击")) tags.add("打精");

  return Array.from(tags);
}

/**
 * Detect UNCATALOG TAGS (临时未分类机制)
 * Rule:
 * - Literal text detection only
 * - No semantic inference
 */
function detectUncatalogTags(html: string): UncatalogTag[] {
  const tags = new Set<UncatalogTag>();

  // ✅ 打断机制
  if (html.includes("打断")) {
    tags.add("打断");
  }

  // ✅ 驱友：同时具备“恢复/回复” + “驱散/卸除”
  const hasRestore =
    html.includes("恢复") || html.includes("回复");
  const hasDispel =
    html.includes("驱散") || html.includes("卸除");

  if (hasRestore && hasDispel) {
    tags.add("驱友");
  }

  return Array.from(tags);
}

export function parseSkill(
  skill: { name: string; desc: string },
  level: number
): ParsedSkill {
  const idx = levelToIndex(level);

  const tripletRegex = /<\s*([\d]+)\s*\/\s*([\d]+)\s*\/\s*([\d]+)\s*>/g;

  let resolved = skill.desc.replace(tripletRegex, (_, a, b, c) => {
    const value = [a, b, c][idx];
    return `<span class="num">${value}</span>`;
  });

  // ✅ merge 万 / 亿 into number span
  resolved = highlightNumberWithUnit(resolved);

  const sentences = resolved
    .split(/(?<=。)/)
    .map((s) => s.trim())
    .filter(Boolean);

  const base: string[] = [];
  const special: string[] = [];

  for (const s of sentences) {
    if (isSpecialCondition(s)) {
      special.push(s);
    } else {
      base.push(s);
    }
  }

  const baseHtml = base.join("");

  return {
    name: skill.name,
    baseHtml,
    specialBlocks: special,
    resourceTags: detectResourceTags(baseHtml),
    damageTags: detectDamageTags(baseHtml),
    uncatalogTags: detectUncatalogTags(baseHtml),
  };
}
