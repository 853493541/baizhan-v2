// utils/advancedSolver.ts

export interface Character {
  _id: string;
  name: string;
  account: string;
  role: "DPS" | "Tank" | "Healer";
  abilities?: Record<string, number>;
}

export interface AbilityCheck {
  name: string;
  level: number;
  available: boolean;
  key?: string;
  index?: number;
  core?: boolean;
}

export interface GroupResult {
  characters: Character[];
  missingAbilities: AbilityCheck[];
  violations: string[];
}

type InternalGroup = {
  chars: Character[];
  accounts: Set<string>;
  hasHealer: boolean;
  maskOr: bigint;
  maskAnd: bigint;
};

// ---------- Core abilities ----------
export const CORE_ABILITIES = [
  "斗转金移",
  "花钱消灾",
  "黑煞落贪狼",
  "一闪天诛",
  "引燃",
  "漾剑式",
  "阴阳术退散",
  "兔死狐悲",
  "飞云回转刀",
  "厄毒爆发",
  "短歌万劫",
];

// ---------- Main characters ----------
const MAIN_CHARACTERS = new Set([
  "剑心猫猫糕",
  "东海甜妹",
  "饲猫大桔",
  "五溪",
  "唐宵风",
  "程老黑",
]);

// ---------- Tier 4 distribution abilities ----------
const DISTRIBUTION_ABILITIES = new Set([
  "黑煞落贪狼",
  "飞云回转刀",
  "引燃",
  "斗转星移",
  "花钱消灾",
  "一闪天诛",
]);

// ---------- helpers ----------
function cloneEmptyGroups(n: number): InternalGroup[] {
  return Array.from({ length: n }, () => ({
    chars: [],
    accounts: new Set<string>(),
    hasHealer: false,
    maskOr: BigInt(0),
    maskAnd: ~BigInt(0),
  }));
}

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------- tolerance ----------
function computeTolerance(totalChars: number, groupSize: number, holders: number) {
  const groups = Math.ceil(totalChars / groupSize);
  const safeCapacity = (groupSize - 1) * groups;
  return Math.max(0, holders - safeCapacity);
}

// ---------- main ----------
export function runAdvancedSolver(
  characters: Character[],
  checkedAbilities: AbilityCheck[],
  groupSize = 3
): GroupResult[] {
  console.time("[advanced solver] total runtime");

  const people = [...characters];
  const groupsCount = Math.max(1, Math.ceil(people.length / groupSize));

  // targeted abilities
  const targeted = checkedAbilities
    .filter((a) => a.available)
    .map((a, idx) => ({
      ...a,
      key: `${a.name}-${a.level}`,
      index: idx,
      core: CORE_ABILITIES.includes(a.name),
    }));

  const abilityIndex = new Map<string, number>();
  targeted.forEach((a) => abilityIndex.set(a.key!, a.index!));

  // char bitmasks
  const charMasks = new Map<string, bigint>();
  for (const c of people) {
    let mask = BigInt(0);
    for (const [abilityName, level] of Object.entries(c.abilities ?? {})) {
      if (level >= 9) {
        const idx9 = abilityIndex.get(`${abilityName}-9`);
        if (idx9 !== undefined) mask |= BigInt(1) << BigInt(idx9);
      }
      if (level >= 10) {
        const idx10 = abilityIndex.get(`${abilityName}-10`);
        if (idx10 !== undefined) mask |= BigInt(1) << BigInt(idx10);
      }
    }
    charMasks.set(c._id, mask);
  }

  // precompute tolerance
  const abilityTolerance = new Map<number, { tol: number; holders: number }>();
  for (const a of targeted) {
    const holders = people.filter((c) => (c.abilities?.[a.name] ?? 0) >= a.level).length;
    const tol = computeTolerance(people.length, groupSize, holders);
    abilityTolerance.set(a.index!, { tol, holders });
  }

  const LOG_INTERVAL = 5000;
  const MAX_ATTEMPTS = 20000;
  let best: GroupResult[] | null = null;
  let bestScore = Number.MAX_SAFE_INTEGER;

  // 🟩 NEW: track average score stats
  let totalScore = 0;
  let validAttempts = 0;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const groups: InternalGroup[] = cloneEmptyGroups(groupsCount);
    const placed = new Set<string>();

    const healers = shuffle(people.filter((p) => p.role === "Healer").slice());
    const others = shuffle(people.filter((p) => p.role !== "Healer").slice());

    const shouldLog = attempt === 0 || attempt % LOG_INTERVAL === 0;

    const canPlaceHard = (g: InternalGroup, c: Character) => {
      if (g.chars.length >= groupSize) return false;
      if (g.accounts.has(c.account)) return false;
      return true;
    };

    const placeGreedy = (c: Character) => {
      let bestGroup: InternalGroup | null = null;
      let bestFree = -1;
      for (const g of groups) {
        const free = groupSize - g.chars.length;
        if (free > bestFree && canPlaceHard(g, c)) {
          bestFree = free;
          bestGroup = g;
        }
      }
      if (!bestGroup) return false;
      const mask = charMasks.get(c._id) ?? BigInt(0);
      bestGroup.chars.push(c);
      bestGroup.accounts.add(c.account);
      if (c.role === "Healer") bestGroup.hasHealer = true;
      bestGroup.maskOr |= mask;
      bestGroup.maskAnd &= mask;
      placed.add(c._id);
      return true;
    };

    for (const h of healers) placeGreedy(h);
    for (const c of others) placeGreedy(c);

    if (placed.size !== people.length) {
      if (shouldLog) {
        console.warn(
          `[advanced solver] attempt ${attempt}: ❌ placement failed (${placed.size}/${people.length})`
        );
      }
      continue;
    }

    // ---------- Tier 1: Hard fails ----------
    let score = 0;
    for (const g of groups) {
      if (!g.hasHealer) {
        if (shouldLog) console.warn(`[advanced solver] attempt ${attempt}: ❌ missing healer`);
        score = -10;
      }
      const seen = new Set<string>();
      let mainCount = 0;
      for (const c of g.chars) {
        if (seen.has(c.account)) {
          if (shouldLog)
            console.warn(
              `[advanced solver] attempt ${attempt}: ❌ duplicate account ${c.account}`
            );
          score = -10;
        }
        seen.add(c.account);

        // 🔥 Main characters cannot be together
        if (MAIN_CHARACTERS.has(c.name)) {
          mainCount++;
          if (mainCount > 1) {
            if (shouldLog) {
              console.warn(
                `[advanced solver] attempt ${attempt}: ❌ multiple main characters in same group`
              );
            }
            score = -10;
          }
        }
      }
    }
    if (score < 0) continue;

    // ---------- Tier 2 + Tier 3 ----------
    for (const a of targeted) {
      const bit = BigInt(1) << BigInt(a.index!);
      const { tol } = abilityTolerance.get(a.index!)!;

      let fullGroups = 0;
      for (const g of groups) {
        if (g.chars.length === groupSize && (g.maskAnd & bit) !== BigInt(0)) {
          fullGroups++;
        }
      }

      if (fullGroups > tol) {
        if (a.core) {
          if (shouldLog) {
            console.warn(
              `[advanced solver] attempt ${attempt}: ❌ core ${a.name}-${a.level} fullGroups=${fullGroups} > tol=${tol}`
            );
          }
          score = -10;
          break;
        } else {
          const excess = fullGroups - tol;
          if (excess > 0) {
            if (a.level === 9) score += excess * 1;
            if (a.level === 10) score += excess * 10;
          }
        }
      }
    }
    if (score < 0) continue;

    // ---------- Tier 4: check only level 10, +500 penalty per missing ----------
    for (const abilityName of DISTRIBUTION_ABILITIES) {
      const level = 10; // only level 10
      const abilityKey = `${abilityName}-${level}`;
      const idx = abilityIndex.get(abilityKey);
      if (idx === undefined) continue;

      const bit = BigInt(1) << BigInt(idx);
      let groupsWithAbility = 0;
      for (const g of groups) {
        if ((g.maskOr & bit) !== BigInt(0)) groupsWithAbility++;
      }

      const missing = groupsCount - groupsWithAbility;
      if (missing > 0) {
        const penalty = missing * 500;
        score += penalty;
        if (shouldLog) {
          console.warn(
            `[advanced solver] attempt ${attempt}: ⚠️ Tier4 penalty for ${abilityName}-10, ` +
            `groupsWithAbility=${groupsWithAbility}/${groupsCount}, missingGroups=${missing}, +${penalty}`
          );
        }
      }
    }

    // 🟦 Track this attempt for average score
    totalScore += score;
    validAttempts++;

    // ---------- Record best ----------
    if (score < bestScore) {
      bestScore = score;
      best = groups.map((g) => {
        const missing = targeted.filter(
          (a) => (g.maskOr & (BigInt(1) << BigInt(a.index!))) === BigInt(0)
        );
        return {
          characters: g.chars,
          missingAbilities: missing,
          violations: [],
        };
      });
      if (bestScore === 0) break;
    }
  }

  // 🟩 Log average score stats
  if (validAttempts > 0) {
    const avgScore = totalScore / validAttempts;
    console.log(
      `[advanced solver] ✅ Average score across ${validAttempts} valid attempts: ${avgScore.toFixed(2)}`
    );
  } else {
    console.warn("[advanced solver] ⚠️ No valid attempts for average score calculation.");
  }

  if (!best) {
    console.error("[advanced solver] ❌ all attempts failed");
    const safeCapacity = (groupSize - 1) * groupsCount;
    for (const a of targeted) {
      const { tol, holders } = abilityTolerance.get(a.index!)!;
      console.error(
        `[advanced solver] tolerance ${a.name}-${a.level}: holders=${holders}, groups=${groupsCount}, ` +
        `safeCapacity=${safeCapacity}, tol=${tol}, core=${a.core ? "Y" : "N"}`
      );
    }
    console.timeEnd("[advanced solver] total runtime");
    return [];
  }

  console.timeEnd("[advanced solver] total runtime");
  return best;
}
