// utils/bossSolver.ts

export type Role = "DPS" | "Tank" | "Healer";

export interface Ability {
  name: string;
  level: number;
}

export interface Character {
  _id: string;
  name: string;
  role: Role;
  account: string;
  abilities: Ability[];
}

interface SolverOptions {
  characters: Character[];
  groupSize: number;
  groupCount: number;
  flexRequired: string[];
  locked: string[][];   // per slot
  roles: Role[];        // per slot
  iterations?: number;  // optional: how many runs (default 20)
}

interface SolverResult {
  success: boolean;
  groups: {
    index: number;
    characters: (Character & { usedAbilities: Ability[] })[];
    coveredAbilities: string[];
  }[];
  errors: string[];
  missing: string[];
  score?: number;
  flexCoverageCount?: number; // ✅ added to fix TS error
}

// ---------------- Helpers ----------------

// shuffle array
function shuffle<T>(arr: T[]): T[] {
  return arr
    .map((x) => ({ x, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map((obj) => obj.x);
}

function pickBestAbility(c: Character, name: string): Ability | null {
  const found = c.abilities
    .filter((a) => a.name === name)
    .sort((a, b) => b.level - a.level);
  return found.length > 0 ? found[0] : null;
}

function fillToThree(c: Character & { usedAbilities: Ability[] }) {
  if (c.usedAbilities.length >= 3) {
    c.usedAbilities = c.usedAbilities
      .slice()
      .sort((a, b) => b.level - a.level)
      .slice(0, 3);
    return;
  }

  const sorted = c.abilities.slice().sort((a, b) => b.level - a.level);

  for (const ab of sorted) {
    if (c.usedAbilities.find((u) => u.name === ab.name)) continue;
    c.usedAbilities.push(ab);
    if (c.usedAbilities.length >= 3) break;
  }
}

function scoreCandidate(
  c: Character,
  requiredRole: Role,
  requiredLocks: string[],
  groupChars: (Character & { usedAbilities: Ability[] })[],
  flexRequired: string[]
): number {
  let score = 0;

  if (requiredRole === "Healer" && c.role === "Healer") score += 50;
  if (requiredRole !== "Healer" && c.role === requiredRole) score += 20;

  for (const lock of requiredLocks) {
    if (lock === "FLEX" || !lock) continue;
    const ab = c.abilities.find((a) => a.name === lock);
    if (ab) score += ab.level * 10;
    else return -9999;
  }

  for (const flex of flexRequired) {
    const ab = c.abilities.find((a) => a.name === flex);
    if (ab) score += ab.level;
  }

  if (groupChars.some((gc) => gc.account === c.account)) {
    score -= 200;
  }

  return score;
}

// ✅ score whole solution
function evaluateSolution(res: SolverResult): number {
  if (!res.success) return -9999;

  let score = 0;

  // reward flex coverage
  score += (res.flexCoverageCount ?? 0) * 50;

  // reward average ability level
  const allAbilities = res.groups.flatMap((g) =>
    g.characters.flatMap((c) => c.usedAbilities.map((a) => a.level))
  );
  const avgLevel = allAbilities.length
    ? allAbilities.reduce((a, b) => a + b, 0) / allAbilities.length
    : 0;
  score += avgLevel * 5;

  // reward healer presence
  res.groups.forEach((g) => {
    if (g.characters.some((c) => c.role === "Healer")) score += 30;
  });

  // penalty for errors
  score -= res.errors.length * 200;

  return score;
}

// ---------------- Greedy Run ----------------
function runGreedyOnce(
  characters: Character[],
  groupSize: number,
  groupCount: number,
  flexRequired: string[],
  locked: string[][],
  roles: Role[]
): SolverResult {
  const groups: SolverResult["groups"] = [];
  const errors: string[] = [];
  const missing: string[] = [];

  const pool = shuffle([...characters]);

  for (let g = 0; g < groupCount; g++) {
    const groupChars: (Character & { usedAbilities: Ability[] })[] = [];
    const covered: string[] = [];

    for (let slot = 0; slot < groupSize; slot++) {
      const requiredRole = roles[slot];
      const requiredLocks = locked[slot] || [];

      const candidate = pool
        .map((c) => ({
          char: c,
          score: scoreCandidate(c, requiredRole, requiredLocks, groupChars, flexRequired),
        }))
        .filter((x) => x.score > -1000)
        .sort((a, b) => b.score - a.score)[0]?.char;

      if (!candidate) {
        errors.push(`小组 ${g + 1}: 无法满足 ${requiredRole} 位的锁定要求`);
        break;
      }

      const usable: Ability[] = [];
      for (const lock of requiredLocks) {
        if (lock === "FLEX" || !lock) continue;
        const found = pickBestAbility(candidate, lock);
        if (found) usable.push(found);
      }

      groupChars.push({
        ...candidate,
        usedAbilities: usable,
      });

      const idx = pool.indexOf(candidate);
      if (idx !== -1) pool.splice(idx, 1);

      covered.push(...usable.map((a) => a.name));
    }

    if (groupChars.length === groupSize) {
      for (const flex of flexRequired) {
        if (groupChars.some((c) => c.usedAbilities.some((a) => a.name === flex))) continue;

        let bestChar: typeof groupChars[number] | null = null;
        let bestAbility: Ability | null = null;

        for (const c of groupChars) {
          if (c.usedAbilities.length >= 3) continue;
          const candidate = pickBestAbility(c, flex);
          if (!candidate) continue;
          if (!bestAbility || candidate.level > bestAbility.level) {
            bestAbility = candidate;
            bestChar = c;
          }
        }

        if (bestChar && bestAbility) {
          bestChar.usedAbilities.push(bestAbility);
          covered.push(bestAbility.name);
        }
      }

      for (const c of groupChars) {
        fillToThree(c);
      }

      if (!groupChars.some((c) => c.role === "Healer")) {
        errors.push(`小组 ${g + 1}: 缺少治疗`);
      }

      groups.push({
        index: g + 1,
        characters: groupChars,
        coveredAbilities: covered,
      });
    }
  }

  for (const f of flexRequired) {
    if (!groups.some((g) => g.coveredAbilities.includes(f))) {
      missing.push(f);
    }
  }

  const result: SolverResult = {
    success: errors.length === 0,
    groups,
    errors,
    missing,
  };

  result.flexCoverageCount = flexRequired.filter((f) =>
    groups.some((g) => g.coveredAbilities.includes(f))
  ).length;

  return result;
}

// ---------------- Multi-run Solver ----------------
export function bossSolver(opts: SolverOptions): SolverResult {
  const {
    characters,
    groupSize,
    groupCount,
    flexRequired,
    locked,
    roles,
    iterations = 20,
  } = opts;

  let best: SolverResult | null = null;
  let bestScore = -99999;

  for (let i = 0; i < iterations; i++) {
    const attempt = runGreedyOnce(
      characters,
      groupSize,
      groupCount,
      flexRequired,
      locked,
      roles
    );
    const score = evaluateSolution(attempt);
    if (score > bestScore) {
      best = attempt;
      bestScore = score;
    }
  }

  if (best) {
    best.score = bestScore;
    return best;
  }

  return {
    success: false,
    groups: [],
    errors: ["❌ 无法生成有效分组"],
    missing: [],
  };
}
