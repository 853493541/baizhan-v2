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
function keyOf(a: AbilityCheck): string {
  return `${a.name}-${a.level}`;
}

function lvlOf(c: Character, a: AbilityCheck): number {
  return c.abilities?.[a.name] ?? 0;
}

function hasAtLevel(c: Character, a: AbilityCheck): boolean {
  return lvlOf(c, a) >= a.level;
}

function freeSlots(g: InternalGroup, size: number) {
  return size - g.chars.length;
}

function groupHasAbility(g: InternalGroup, a: AbilityCheck) {
  return (g.abilityCount.get(keyOf(a)) ?? 0) > 0;
}

function evaluateMissing(g: InternalGroup, targeted: AbilityCheck[]) {
  return targeted.filter((a) => !groupHasAbility(g, a));
}

function addCharAndBumpCounts(g: InternalGroup, c: Character, targeted: AbilityCheck[]) {
  g.chars.push(c);
  g.accounts.add(c.account);
  if (c.role === "Healer") g.hasHealer = true;
  for (const a of targeted) {
    if (hasAtLevel(c, a)) {
      const key = keyOf(a);
      const next = (g.abilityCount.get(key) ?? 0) + 1;
      g.abilityCount.set(key, next);
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

// ---------- aftermath analysis ----------
function logAftermath(groups: GroupResult[], abilityPool: AbilityCheck[]) {
  console.log("[advanced solver][aftermath] ===== Aftermath Analysis =====");

  const globalWasted9: string[] = [];
  const globalWasted10: string[] = [];

  groups.forEach((g, idx) => {
    const charCount = g.characters.length;
    if (charCount === 0) {
      console.log(`[advanced solver][aftermath] Group ${idx + 1}: (empty)`);
      return;
    }

    const abilityPresence = new Map<string, number>();

    for (const c of g.characters) {
      for (const a of abilityPool) {
        if ((c.abilities?.[a.name] ?? 0) >= a.level) {
          const key = `${a.name}-${a.level}`;
          abilityPresence.set(key, (abilityPresence.get(key) ?? 0) + 1);
        }
      }
    }

    const wasted9: string[] = [];
    const wasted10: string[] = [];

    for (const [key, count] of abilityPresence.entries()) {
      if (count === charCount) {
        const [name, levelStr] = key.split("-");
        if (levelStr === "9") {
          wasted9.push(name);
          globalWasted9.push(name);
        }
        if (levelStr === "10") {
          wasted10.push(name);
          globalWasted10.push(name);
        }
      }
    }

    console.log(`[advanced solver][aftermath] Group ${idx + 1}:`);
    if (wasted9.length > 0)
      console.log(`[advanced solver][aftermath]   9重无需求: ${wasted9.join("，")}`);
    if (wasted10.length > 0)
      console.log(`[advanced solver][aftermath]   10重无需求: ${wasted10.join("，")}`);
    if (wasted9.length === 0 && wasted10.length === 0)
      console.log("[advanced solver][aftermath]   ✅ No wasted abilities");
  });

  console.log("[advanced solver][aftermath] ===== Global Totals =====");
  console.log(`[advanced solver][aftermath] Level 9 wasted total: ${globalWasted9.length}`);
  console.log(`[advanced solver][aftermath] Level 10 wasted total: ${globalWasted10.length}`);
}

// ---------- scoring ----------
function evaluateScore(groups: InternalGroup[], targeted: AbilityCheck[]): { score: number; violations: string[][] } {
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
    const abilityPresence = new Map<string, number>();

    for (const c of g.chars) {
      for (const a of targeted) {
        if ((c.abilities?.[a.name] ?? 0) >= a.level) {
          const key = `${a.name}-${a.level}`;
          abilityPresence.set(key, (abilityPresence.get(key) ?? 0) + 1);
        }
      }
    }

    for (const [key, count] of abilityPresence.entries()) {
      if (count === charCount) {
        const [_, levelStr] = key.split("-");
        if (levelStr === "9") wasted9++;
        if (levelStr === "10") wasted10++;
      }
    }
  }

  score += wasted9 * 1 + wasted10 * 10;

  console.log(`[advanced solver] score breakdown: wasted9=${wasted9}, wasted10=${wasted10}, totalScore=${score}`);

  return { score, violations };
}

// ---------- main ----------
export function runAdvancedSolver(
  characters: Character[],
  checkedAbilities: AbilityCheck[],
  groupSize = 3
): GroupResult[] {
  console.log("[advanced solver] starting run...");
  const people = [...characters];
  const groupsCount = Math.max(1, Math.ceil(people.length / groupSize));
  const targeted = checkedAbilities.filter((a) => a.available);

  const MAX_ATTEMPTS = 2000;
  let best: GroupResult[] | null = null;
  let bestScore = Number.MAX_SAFE_INTEGER;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const groups: InternalGroup[] = cloneEmptyGroups(groupsCount);
    const placed = new Set<string>();

    const healers = shuffle(people.filter((p) => p.role === "Healer").slice());
    const others = shuffle(people.filter((p) => p.role !== "Healer").slice());

    const canPlaceHard = (g: InternalGroup, c: Character) => {
      if (freeSlots(g, groupSize) <= 0) return false;
      if (g.accounts.has(c.account)) return false;
      return true;
    };

    const placeGreedy = (c: Character) => {
      const ranked = groups
        .map((g, i) => ({ g, i, score: freeSlots(g, groupSize) }))
        .sort((a, b) => b.score - a.score);

      for (const { g } of ranked) {
        if (canPlaceHard(g, c)) {
          addCharAndBumpCounts(g, c, targeted);
          placed.add(c._id);
          return true;
        }
      }
      return false;
    };

    for (const h of healers) placeGreedy(h);
    for (const c of others) placeGreedy(c);

    if (placed.size !== people.length) {
      console.log(`[advanced solver] attempt ${attempt + 1}: failed placement (placed=${placed.size}/${people.length})`);
      continue;
    }

    const { score, violations } = evaluateScore(groups, targeted);

    console.log(`[advanced solver] attempt ${attempt + 1}: score=${score}`);

    if (score >= 0 && score < bestScore) {
      bestScore = score;
      best = groups.map((g, i) => ({
        characters: g.chars,
        missingAbilities: evaluateMissing(g, targeted),
        violations: violations[i],
      }));
      console.log(`[advanced solver] ✅ new best score = ${bestScore}`);
      if (bestScore === 0) break;
    }
  }

  if (!best) {
    console.warn("[advanced solver] all attempts failed, fallback sequential.");
    const fallbackGroups = cloneEmptyGroups(groupsCount);
    let idx = 0;
    for (const c of people) {
      fallbackGroups[idx % groupsCount].chars.push(c);
      idx++;
    }
    const fallbackResults = fallbackGroups.map((g) => ({
      characters: g.chars,
      missingAbilities: evaluateMissing(g, targeted),
      violations: !g.hasHealer ? ["缺少治疗"] : [],
    }));
    logAftermath(fallbackResults, targeted);
    return fallbackResults;
  }

  logAftermath(best, targeted);
  console.log(`[advanced solver] finished: best score=${bestScore}`);
  return best;
}
