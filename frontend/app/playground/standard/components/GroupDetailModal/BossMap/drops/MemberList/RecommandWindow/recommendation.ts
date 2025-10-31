import { MAIN_CHARACTERS, tradableSet } from "../../drophelpers";

export interface RecommendationStep {
  reason: string;
  passed: boolean | "fallback";
}

export interface RecommendationResult {
  bestCandidate: any | null;
  steps: RecommendationStep[];
  tiedCandidates?: string[];
}

/* === 变招（Variant Skills）: excluded from collection/progress stats === */
const variantSet: Set<string> = new Set([
  "冲炎枪",
  "毒指功",
  "枪法蝮蛇",
  "蛮熊碎颅击",
  "水遁水流闪",
  "阴雷之种",
]);

/* === Mirror skill map (cross-gender equivalence, both symmetric and asymmetric) === */
function getLinkedGenderAbility(ability: string, gender?: string): string | null {
  // 双向 transferable pair
  if (ability === "剑心通明" && gender === "男") return "巨猿劈山";
  if (ability === "巨猿劈山" && gender === "女") return "剑心通明";

  // 单向: female counts 水遁水流闪 as owning 蛮熊碎颅击
  if (ability === "蛮熊碎颅击" && gender === "女") return "水遁水流闪";

  return null;
}

/* === Helper: check if character has an unused level-10 ability in storage === */
const hasLevel10InStorage = (character: any, ability: string): boolean => {
  const storage = character?.storage;
  if (!Array.isArray(storage)) return false;
  return storage.some(
    (item: any) =>
      item.ability === ability && item.level === 10 && item.used === false
  );
};

/* === Helper: count number of valid level-10 abilities from this boss === */
const countLevel10FromBoss = (character: any, dropList: string[]): number => {
  if (!character?.abilities) return 0;

  // Filter valid abilities
  const filtered = dropList.filter((ab) => {
    // Exclude tradables and variants
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

/** 🧠 Main logic with elimination trace */
export function pickBestCharacterWithTrace(
  ability: string,
  level: number,
  group: any,
  dropList: string[]
): RecommendationResult {
  const steps: RecommendationStep[] = [];

  /* ---------------- STEP 1: Eligibility ---------------- */
  let candidates: any[] = [];

  for (const c of group.characters) {
    const linked = getLinkedGenderAbility(ability, c.gender);
    const abilityLv = c.abilities?.[ability] ?? 0;
    const linkedLv = linked ? c.abilities?.[linked] ?? 0 : 0;

    const current = Math.max(abilityLv, linkedLv);
    const mirrorNote =
      linked && linkedLv > 0 && linkedLv >= abilityLv
        ? `（含等价技能 ${linked}）`
        : "";

    // ❌ female can't learn male-only 蛮熊碎颅击 unless mirrored
    const invalidFemale =
      ability === "蛮熊碎颅击" && c.gender === "女" && linkedLv === 0;

    if (invalidFemale) {
      steps.push({
        reason: `角色 ${c.name}：性别为女，且无等价技能水遁水流闪 → 不可学习蛮熊碎颅击，淘汰`,
        passed: false,
      });
      continue;
    }

    if (current >= level) {
      steps.push({
        reason: `角色 ${c.name}：当前等级 ${current} ≥ ${level}${mirrorNote} → 已拥有该技能，淘汰`,
        passed: false,
      });
    } else {
      steps.push({
        reason: `角色 ${c.name}：当前等级 ${current} < ${level}${mirrorNote} → 可获得，保留`,
        passed: true,
      });
      candidates.push(c);
    }
  }

  if (candidates.length === 0) {
    steps.push({
      reason: "所有角色均已拥有此技能或其等价技能 → 无可分配对象。",
      passed: false,
    });
    return { bestCandidate: null, steps };
  }

  if (candidates.length === 1) {
    steps.push({
      reason: `步骤 1 结束：仅剩 1 名候选 → 直接推荐：${candidates[0].name}`,
      passed: true,
    });
    return { bestCandidate: candidates[0], steps };
  }

  steps.push({
    reason: `步骤 1 结束：剩余 ${candidates.length} 名候选：${candidates
      .map((c) => c.name)
      .join("、")}`,
    passed: true,
  });

  /* ---------------- STEP 2: Main character (disabled) ---------------- */
  steps.push({
    reason: "步骤 2：主角色优先规则已关闭（测试模式）",
    passed: false,
  });

  /* ---------------- STEP 3: Storage 10 check (only for 9 drops) ---------------- */
  if (level === 9) {
    const withStorage = candidates.filter((c) =>
      hasLevel10InStorage(c, ability)
    );
    if (withStorage.length > 0) {
      steps.push({
        reason: `步骤 3：${withStorage
          .map((c) => c.name)
          .join("、")} 包中有 10 重技能 → 优先考虑`,
        passed: true,
      });
      if (withStorage.length === 1) {
        steps.push({
          reason: `最终推荐：${withStorage[0].name}（包里有 10 重）`,
          passed: true,
        });
        return { bestCandidate: withStorage[0], steps };
      }
      candidates = withStorage;
    } else {
      steps.push({
        reason: "步骤 3：无人包中有 10 重 → 跳过。",
        passed: false,
      });
    }
  }

  /* ---------------- STEP 4: Highest current ability level ---------------- */
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

  if (levelFiltered.length < candidates.length) {
    steps.push({
      reason: `步骤 4：当前技能或等价技能等级最高为 ${maxLv} 重 → 保留 ${levelFiltered
        .map((c) => c.name)
        .join("、")}`,
      passed: true,
    });
  } else {
    steps.push({
      reason: "步骤 4：所有候选等级相同 → 跳过。",
      passed: false,
    });
  }

  candidates = levelFiltered;
  if (candidates.length === 1) {
    steps.push({
      reason: `最终推荐：${candidates[0].name}（当前等级最高）`,
      passed: true,
    });
    return { bestCandidate: candidates[0], steps };
  }

  /* ---------------- STEP 5: Tier-aware Boss progress comparison ---------------- */
  const withProgress = candidates.map((c) => {
    const filteredDrops = dropList.filter((ab) => {
      if (tradableSet.has(ab)) return false;
      if (variantSet.has(ab)) return false;
      if (c.gender === "男" && ab === "剑心通明") return false;
      if (c.gender === "女" && ab === "巨猿劈山") return false;
      if (c.gender === "女" && ab === "蛮熊碎颅击") return false;
      return true;
    });

    const total = filteredDrops.length;
    if (total === 0) return { c, collected: 0, total, skip: true };

    const collected = filteredDrops.reduce((count, ab) => {
      const linked = getLinkedGenderAbility(ab, c.gender);
      const abilityLv = c.abilities?.[ab] ?? 0;
      const linkedLv = linked ? c.abilities?.[linked] ?? 0 : 0;
      return Math.max(abilityLv, linkedLv) >= level ? count + 1 : count;
    }, 0);

    return { c, collected, total, skip: false };
  });

  const allSkipped = withProgress.every((x) => x.skip);
  if (allSkipped) {
    steps.push({
      reason: "步骤 5：Boss 所有掉落均为可交易或变招技能 → 跳过进度比较。",
      passed: false,
    });
  } else {
    const validProgress = withProgress.filter((x) => !x.skip);
    const maxCollected = Math.max(...validProgress.map((x) => x.collected));
    const progFiltered = validProgress
      .filter((x) => x.collected === maxCollected)
      .map((x) => x.c);

    const progressSummary = validProgress
      .map((x) => `${x.c.name} ${x.collected}/${x.total}`)
      .join("、");

    if (progFiltered.length < candidates.length) {
      steps.push({
        reason: `步骤 5：Boss 进度（含等价技能，排除可交易、变招与性别限定，统计 ≥${level} 重）→ ${progressSummary} → 最高进度 ${maxCollected}/${validProgress[0].total} （${progFiltered
          .map((c) => c.name)
          .join("、")}）`,
        passed: true,
      });
      candidates = progFiltered;
    } else {
      steps.push({
        reason: `步骤 5：Boss 进度相同 （${progressSummary}） → 跳过。`,
        passed: false,
      });
    }
  }

  /* ---------------- STEP 6: Most level-10 abilities (final tiebreaker) ---------------- */
  if (allSkipped) {
    steps.push({
      reason: "步骤 6：Boss 无可计入技能 → 跳过十重比较。",
      passed: false,
    });
    return { bestCandidate: null, steps };
  }

  const withTen = candidates.map((c) => ({
    c,
    count: countLevel10FromBoss(c, dropList),
  }));
  const maxTen = Math.max(...withTen.map((x) => x.count));
  const tenFiltered = withTen
    .filter((x) => x.count === maxTen)
    .map((x) => x.c);

  const tie = tenFiltered.length > 1;

  steps.push({
    reason: `步骤 6：十重技能数量最多为 ${maxTen} → 保留 ${tenFiltered
      .map((c) => c.name)
      .join("、")}`,
    passed: tie ? "fallback" : true,
  });

  if (tie) {
    steps.push({
      reason: `平局 → 建议人工判断（${tenFiltered
        .map((c) => c.name)
        .join("、")}）`,
      passed: "fallback",
    });
    return {
      bestCandidate: null,
      steps,
      tiedCandidates: tenFiltered.map((c) => c.name),
    };
  }

  const winner = tenFiltered[0];
  steps.push({
    reason: `最终推荐：${winner.name}（十重数量最多）`,
    passed: true,
  });

  return { bestCandidate: winner, steps };
}
