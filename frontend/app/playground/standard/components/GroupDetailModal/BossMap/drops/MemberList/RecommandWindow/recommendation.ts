import { MAIN_CHARACTERS, tradableSet } from "../../drophelpers";

export interface RecommendationStep {
  reason: string;
  passed: boolean;
}

export interface RecommendationResult {
  bestCandidate: any | null;
  steps: RecommendationStep[];
  tiedCandidates?: string[];
}

/* === 变招（Variant Skills）=== */
const variantSet: Set<string> = new Set([
  "冲炎枪",
  "毒指功",
  "枪法蝮蛇",
  "蛮熊碎颅击",
  "水遁水流闪",
  "阴雷之种",
]);

/* === Mirror skill map === */
function getLinkedGenderAbility(ability: string, gender?: string): string | null {
  if (ability === "剑心通明" && gender === "男") return "巨猿劈山";
  if (ability === "巨猿劈山" && gender === "女") return "剑心通明";
  if (ability === "蛮熊碎颅击" && gender === "女") return "水遁水流闪";
  return null;
}

/* === Healer abilities === */
const healerAbilities = new Set([
  "万花金创药",
  "特制金创药",
  "霞月长针",
  "毓秀灵药",
]);

/* Safely get character role no matter where it's stored */
const getRole = (c: any): string | null => {
  return (
    c?.role ||
    c?.Role ||
    c?.character?.role ||
    c?.character?.Role ||
    c?.data?.role ||
    null
  );
};

/* === Convert number → Chinese numerals for level display === */
const numToChinese = (num: number): string => {
  const map = ["〇", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  if (num <= 10) return map[num];
  if (num < 20) return "十" + map[num - 10];
  const tens = Math.floor(num / 10);
  const ones = num % 10;
  return map[tens] + "十" + (ones > 0 ? map[ones] : "");
};

/* === Helpers === */
const countLevel9FromBoss = (character: any, dropList: string[]): number => {
  if (!character?.abilities) return 0;
  const filtered = dropList.filter((ab) => {
    if (tradableSet.has(ab)) return false;
    if (variantSet.has(ab)) return false;
    if (character.gender === "男" && ab === "剑心通明") return false;
    if (character.gender === "女" && ab === "巨猿劈山") return false;
    if (character.gender === "女" && ab === "蛮熊碎颅击") return false;
    return true;
  });
  return filtered.reduce((count, ab) => {
    const linked = getLinkedGenderAbility(ab, character.gender);
    const lv =
      character.abilities?.[ab] ??
      (linked ? character.abilities?.[linked] : 0) ??
      0;
    return lv >= 9 ? count + 1 : count;
  }, 0);
};

const countLevel10FromBoss = (character: any, dropList: string[]): number => {
  if (!character?.abilities) return 0;
  const filtered = dropList.filter((ab) => {
    if (tradableSet.has(ab)) return false;
    if (variantSet.has(ab)) return false;
    if (character.gender === "男" && ab === "剑心通明") return false;
    if (character.gender === "女" && ab === "巨猿劈山") return false;
    if (character.gender === "女" && ab === "蛮熊碎颅击") return false;
    return true;
  });
  return filtered.reduce((count, ab) => {
    const linked = getLinkedGenderAbility(ab, character.gender);
    const lv =
      character.abilities?.[ab] ??
      (linked ? character.abilities?.[linked] : 0) ??
      0;
    return lv >= 10 ? count + 1 : count;
  }, 0);
};

/** 🧠 Final version — includes improved 背包检查 logic & display */
export function pickBestCharacterWithTrace(
  ability: string,
  level: number,
  group: any,
  dropList: string[]
): RecommendationResult {
  const steps: RecommendationStep[] = [];

  const finalize = (candidate: any): RecommendationResult => {
    steps.push({
      reason: `ⓘ [最终结果] → ${candidate.name}`,
      passed: true,
    });
    return { bestCandidate: candidate, steps };
  };

  /* ---------------- ① 资格筛选 ---------------- */
  let candidates: any[] = [];
  const eliminatedByGender: string[] = [];
  const eliminatedByOwned: string[] = [];

  for (const c of group.characters) {
    const linked = getLinkedGenderAbility(ability, c.gender);
    const abilityLv = c.abilities?.[ability] ?? 0;
    const linkedLv = linked ? c.abilities?.[linked] ?? 0 : 0;
    const current = Math.max(abilityLv, linkedLv);
    const invalidFemale =
      ability === "蛮熊碎颅击" && c.gender === "女" && linkedLv === 0;

    if (invalidFemale) {
      eliminatedByGender.push(c.name);
      continue;
    }
    if (current >= level) {
      eliminatedByOwned.push(c.name);
    } else {
      candidates.push(c);
    }
  }

  let step1Text = "① ";
  if (eliminatedByOwned.length === 0 && eliminatedByGender.length === 0) {
    step1Text += "[可用检查] 都能用";
  } else {
    const parts: string[] = [];
    if (eliminatedByOwned.length)
      parts.push(`[可用检查] ${eliminatedByOwned.join("、")} 已有`);
    if (eliminatedByGender.length)
      parts.push(
        `${eliminatedByGender.join("、")} 无法学习该技能 → 淘汰`
      );
    step1Text += parts.join("，");
  }
  steps.push({ reason: step1Text, passed: candidates.length > 0 });

  if (candidates.length === 0) return { bestCandidate: null, steps };
  if (candidates.length === 1) return finalize(candidates[0]);

  /* ---------------- ② 主角色优先 ---------------- */
  const isMain = (name: string): boolean => {
    if (!MAIN_CHARACTERS) return false;
    if (Array.isArray(MAIN_CHARACTERS)) return MAIN_CHARACTERS.includes(name);
    if (MAIN_CHARACTERS instanceof Set) return MAIN_CHARACTERS.has(name);
    if (typeof MAIN_CHARACTERS === "object") return !!MAIN_CHARACTERS[name];
    return false;
  };
  const mainCandidates = candidates.filter((c) => isMain(c.name));
  if (mainCandidates.length > 0) {
    if (mainCandidates.length === 1) {
      steps.push({
        reason: `② [大号检查] ${mainCandidates[0].name} → 结束`,
        passed: true,
      });
      return finalize(mainCandidates[0]);
    } else {
      steps.push({
        reason: `② [大号检查] → ${mainCandidates
          .map((c) => c.name)
          .join("、")}`,
        passed: true,
      });
      candidates = mainCandidates;
    }
  } else {
    steps.push({ reason: "② [大号检查] 无大号 → 跳过", passed: false });
  }

  /* ---------------- ③ 👜 背包检查（最终展示版） ---------------- */
  if (level === 9) {
    // ✅ 九重掉落 → 优先考虑包里已有十重的角色
    const backpack10 = candidates.filter((c) => {
      if (!Array.isArray(c.storage)) return false;
      const linked = getLinkedGenderAbility(ability, c.gender);
      const item = c.storage.find(
        (it: any) =>
          it?.ability === ability || (linked && it?.ability === linked)
      );
      if (!item) return false;
      const lv = typeof item.level === "number" ? item.level : 10;
      return lv >= 10;
    });

    if (backpack10.length === 1) {
      steps.push({
        reason: `③ [背包检查] ${backpack10[0].name} 包里有十`,
        passed: true,
      });
      return finalize(backpack10[0]);
    } else if (backpack10.length > 1) {
      steps.push({
        reason: `③ [背包检查] ${backpack10
          .map((c) => c.name)
          .join("、")} 包里有十`,
        passed: true,
      });
      candidates = backpack10;
    } else {
      steps.push({ reason: "③ [背包检查] 无储存 → 跳过", passed: false });
    }
  } else if (level === 10) {
    // ✅ 十重掉落 → 避免浪费在已有十重书的角色
    const has10Book = (c: any): boolean => {
      if (!Array.isArray(c.storage)) return false;
      const linked = getLinkedGenderAbility(ability, c.gender);
      const item = c.storage.find(
        (it: any) =>
          it?.ability === ability || (linked && it?.ability === linked)
      );
      if (!item) return false;
      const lv = typeof item.level === "number" ? item.level : 10;
      return lv >= 10;
    };

    const with10 = candidates.filter(has10Book);
    const without10 = candidates.filter((c) => !has10Book(c));

    if (without10.length === 1) {
      steps.push({
        reason: `③ [背包检查] 只有${without10[0].name}包里没十 → 结束`,
        passed: true,
      });
      return finalize(without10[0]);
    } else if (without10.length > 1 && with10.length > 0) {
      steps.push({
        reason: `③ [背包检查] ${with10
          .map((c) => c.name)
          .join("、")} 已有十重 → 淘汰`,
        passed: true,
      });
      candidates = without10;
    } else if (without10.length > 1 && with10.length === 0) {
      steps.push({
        reason: "③ [背包检查] 无储存 → 跳过",
        passed: false,
      });
    } else {
      steps.push({
        reason: "③ [背包检查] 所有人都有十 → 跳过",
        passed: false,
      });
    }
  }

  /* ---------------- ④ 治疗技能过滤 ---------------- */
  if (healerAbilities.has(ability)) {
    const healerOnly = candidates.filter(
      (c) => (getRole(c)?.toLowerCase?.() ?? "") === "healer"
    );
    const eliminated = candidates.filter(
      (c) => (getRole(c)?.toLowerCase?.() ?? "") !== "healer"
    );

    if (healerOnly.length > 0) {
      if (eliminated.length > 0) {
        steps.push({
          reason: `④ [治疗检查] 淘汰 ${eliminated
            .map((c) => c.name)
            .join("、")}`,
          passed: true,
        });
      } else {
        steps.push({ reason: "④ [治疗检查] 无淘汰", passed: true });
      }
      candidates = healerOnly;
      if (candidates.length === 1) return finalize(candidates[0]);
    } else {
      steps.push({
        reason: "④ [治疗检查] 无需求治疗角色 → 跳过",
        passed: false,
      });
    }
  } else {
    steps.push({ reason: "④ [治疗检查] 非治疗技 → 跳过", passed: false });
  }

  /* ---------------- ⑤ 当前等级最高 ---------------- */
  const maxLv = Math.max(
    ...candidates.map((c) => {
      const linked = getLinkedGenderAbility(ability, c.gender);
      const abilityLv = c.abilities?.[ability] ?? 0;
      const linkedLv = linked ? c.abilities?.[linked] ?? 0 : 0;
      return Math.max(abilityLv, linkedLv);
    })
  );

  const levelFiltered = candidates.filter((c) => {
    const linked = getLinkedGenderAbility(ability, c.gender);
    const abilityLv = c.abilities?.[ability] ?? 0;
    const linkedLv = linked ? c.abilities?.[linked] ?? 0 : 0;
    return Math.max(abilityLv, linkedLv) === maxLv;
  });

  if (levelFiltered.length === 1) {
    steps.push({
      reason: `⑤ [重数检查] ${levelFiltered[0].name} 重数最高（${numToChinese(
        maxLv
      )}重）→ 结束`,
      passed: true,
    });
    return finalize(levelFiltered[0]);
  }

  if (levelFiltered.length === candidates.length) {
    steps.push({
      reason: `⑤ [重数检查] 都是${numToChinese(maxLv)}重 → 跳过`,
      passed: false,
    });
  } else {
    steps.push({
      reason: `⑤ [重数检查] ${candidates
        .filter((c) => !levelFiltered.includes(c))
        .map((c) => c.name)
        .join("、")} 重数最低 → 淘汰`,
      passed: true,
    });
  }
  candidates = levelFiltered;

  /* ---------------- ⑥～⑦ 九重 / 十重 进度检查 ---------------- */
  const runProgressCheck = (
    label: string,
    counter: (c: any, list: string[]) => number
  ): { top: any[]; maxVal: number } => {
    const withCount = candidates.map((c) => ({
      c,
      count: counter(c, dropList),
    }));
    const maxVal = Math.max(...withCount.map((x) => x.count));
    const top = withCount.filter((x) => x.count === maxVal).map((x) => x.c);

    if (top.length === 1) {
      const winner = top[0];
      steps.push({
        reason: `${label} ${winner.name}最多（${maxVal}）→ 结束`,
        passed: true,
      });
      return { top, maxVal };
    } else {
      const names = top.map((c) => c.name).join("、");
      steps.push({
        reason: `${label} 进度相同：${names}`,
        passed: false,
      });
      return { top, maxVal };
    }
  };

  // Dynamic ordering depending on ability level
  let firstLabel, firstCounter, secondLabel, secondCounter;
  if (level === 9) {
    firstLabel = "⑥ [九重进度]";
    firstCounter = countLevel9FromBoss;
    secondLabel = "⑦ [十重进度]";
    secondCounter = countLevel10FromBoss;
  } else {
    firstLabel = "⑥ [十重进度]";
    firstCounter = countLevel10FromBoss;
    secondLabel = "⑦ [九重进度]";
    secondCounter = countLevel9FromBoss;
  }

  const { top: firstTop } = runProgressCheck(firstLabel, firstCounter);
  if (firstTop.length === 1) return finalize(firstTop[0]);

  const { top: secondTop } = runProgressCheck(secondLabel, secondCounter);
  if (secondTop.length === 1) return finalize(secondTop[0]);

  steps.push({
    reason: "ⓘ [结果] 进度相同 → 手动选择",
    passed: false,
  });
  return {
    bestCandidate: null,
    steps,
    tiedCandidates: secondTop.map((c) => c.name),
  };
}
