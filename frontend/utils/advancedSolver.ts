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
  key?: string; // ✅ precomputed `${name}-${level}`
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
  abilityCount: Map<string, number>; // key = "name-level"
};

// ---------- helpers ----------
function freeSlots(g: InternalGroup, size: number) {
  return size - g.chars.length;
}

function groupHasAbility(g: InternalGroup, a: AbilityCheck) {
  return (g.abilityCount.get(a.key!) ?? 0) > 0;
}

function evaluateMissing(
  g: InternalGroup,
  targeted: AbilityCheck[],
  charSatisfies: Map<string, Set<string>>
) {
  return targeted.filter((a) => !groupHasAbility(g, a));
}

function addCharAndBumpCounts(
  g: InternalGroup,
  c: Character,
  targeted: AbilityCheck[],
  charSatisfies: Map<string, Set<string>>
) {
  g.chars.push(c);
  g.accounts.add(c.account);
  if (c.role === "Healer") g.hasHealer = true;
  for (const a of targeted) {
    if (charSatisfies.get(c._id)?.has(a.key!)) {
      const next = (g.abilityCount.get(a.key!) ?? 0) + 1;
      g.abilityCount.set(a.key!, next);
    }
  }
}

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function cloneEmptyGroups(n: number): InternalGroup[] {
  return Array.from({ length: n }, () => ({
    chars: [],
    accounts: new Set<string>(),
    hasHealer: false,
    abilityCount: new Map<string, number>(),
  }));
}

// ---------- scoring (optimized) ----------
function evaluateScore(
  groups: InternalGroup[],
  targeted: AbilityCheck[],
  charSatisfies: Map<string, Set<string>>
): { score: number; violations: string[][] } {
  const violations: string[][] = [];
  let score = 0;

  // Tier 1: instant fails
  for (const g of groups) {
    const v: string[] = [];

    if (!g.hasHealer) {
      v.push("缺少治疗");
      score = -10;
    }

    const seen = new Set<string>();
    for (const c of g.chars) {
      if (seen.has(c.account)) {
        v.push(`重复账号: ${c.account}`);
        score = -10;
      }
      seen.add(c.account);
    }

    violations.push(v);
  }

  if (score === -10) return { score, violations };

  // Tier 3: wasted ability penalties
  let wasted9 = 0;
  let wasted10 = 0;

  for (const g of groups) {
    const charCount = g.chars.length;

    for (const [key, count] of g.abilityCount.entries()) {
      if (count === charCount) {
        if (key.endsWith("-9")) wasted9++;
        if (key.endsWith("-10")) wasted10++;
      }
    }
  }

  score += wasted9 * 1 + wasted10 * 10;
  return { score, violations };
}

// ---------- main ----------
export function runAdvancedSolver(
  characters: Character[],
  checkedAbilities: AbilityCheck[],
  groupSize = 3
): GroupResult[] {
  console.time("[advanced solver] total runtime"); // ⏱️ start timing

  const people = [...characters];
  const groupsCount = Math.max(1, Math.ceil(people.length / groupSize));

  // ✅ Precompute ability keys once
  const targeted = checkedAbilities
    .filter((a) => a.available)
    .map((a) => ({ ...a, key: `${a.name}-${a.level}` }));

  // ✅ Precompute satisfied ability sets per character
  const charSatisfies = new Map<string, Set<string>>();
  for (const c of people) {
    const satisfied = new Set<string>();
    for (const [abilityName, level] of Object.entries(c.abilities ?? {})) {
      if (level >= 9) satisfied.add(`${abilityName}-9`);
      if (level >= 10) satisfied.add(`${abilityName}-10`);
    }
    charSatisfies.set(c._id, satisfied);
  }

  const MAX_ATTEMPTS = 2000;
  let best: GroupResult[] | null = null;
  let bestScore = Number.MAX_SAFE_INTEGER;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const groups: InternalGroup[] = cloneEmptyGroups(groupsCount);
    const placed = new Set<string>();

    const healers = shuffle(people.filter((p) => p.role === "Healer").slice());
    const others = shuffle(people.filter((p) => p.role !== "Healer").slice());

    const canPlaceHard = (g: InternalGroup, c: Character) => {
      if (g.chars.length >= groupSize) return false;
      if (g.accounts.has(c.account)) return false;
      return true;
    };

    // ✅ Optimized placement: scan groups, no sort
    const placeGreedy = (c: Character) => {
      let bestGroup: InternalGroup | null = null;
      let bestScore = -1;

      for (const g of groups) {
        const score = groupSize - g.chars.length;
        if (score > bestScore && canPlaceHard(g, c)) {
          bestScore = score;
          bestGroup = g;
        }
      }

      if (bestGroup) {
        addCharAndBumpCounts(bestGroup, c, targeted, charSatisfies);
        placed.add(c._id);
        return true;
      }
      return false;
    };

    for (const h of healers) placeGreedy(h);
    for (const c of others) placeGreedy(c);

    if (placed.size !== people.length) continue;

    const { score, violations } = evaluateScore(groups, targeted, charSatisfies);

    if (score >= 0 && score < bestScore) {
      bestScore = score;
      best = groups.map((g, i) => ({
        characters: g.chars,
        missingAbilities: evaluateMissing(g, targeted, charSatisfies),
        violations: violations[i],
      }));
      if (bestScore === 0) break;
    }
  }

  if (!best) {
    const fallbackGroups = cloneEmptyGroups(groupsCount);
    let idx = 0;
    for (const c of people) {
      fallbackGroups[idx % groupsCount].chars.push(c);
      idx++;
    }
    const fallbackResults = fallbackGroups.map((g) => ({
      characters: g.chars,
      missingAbilities: evaluateMissing(g, targeted, charSatisfies),
      violations: !g.hasHealer ? ["缺少治疗"] : [],
    }));
    console.timeEnd("[advanced solver] total runtime");
    return fallbackResults;
  }

  console.timeEnd("[advanced solver] total runtime");
  return best;
}
