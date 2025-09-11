export interface Character {
  _id: string;
  name: string;
  account: string;
  role: "DPS" | "Tank" | "Healer";
  // ability name → level (e.g. { "黑煞落贪狼": 10, "漾剑式": 9 })
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
  abilityCount: Map<string, number>;
};

// ---------- helpers ----------
function lvlOf(c: Character, abilityName: string): number {
  return c.abilities?.[abilityName] ?? 0;
}

function hasAtLevel(c: Character, a: AbilityCheck): boolean {
  return lvlOf(c, a.name) >= a.level;
}

function freeSlots(g: InternalGroup, size: number) {
  return size - g.chars.length;
}

function addChar(g: InternalGroup, c: Character, targeted: AbilityCheck[]) {
  g.chars.push(c);
  g.accounts.add(c.account);
  if (c.role === "Healer") g.hasHealer = true;
  for (const a of targeted) {
    if (hasAtLevel(c, a)) {
      g.abilityCount.set(a.name, (g.abilityCount.get(a.name) ?? 0) + 1);
    }
  }
}

function groupHasAbility(g: InternalGroup, a: AbilityCheck) {
  return (g.abilityCount.get(a.name) ?? 0) > 0;
}

function evaluateMissing(g: InternalGroup, targeted: AbilityCheck[]) {
  return targeted.filter((a) => !groupHasAbility(g, a));
}

function collectViolations(
  g: InternalGroup,
  size: number,
  perAbilityMax: Map<string, number>
): string[] {
  const v: string[] = [];

  // duplicate accounts
  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const c of g.chars) {
    if (seen.has(c.account)) dups.add(c.account);
    seen.add(c.account);
  }
  if (dups.size > 0) v.push(`重复账号: ${Array.from(dups).join("、")}`);

  // healer
  if (!g.hasHealer) v.push("缺少治疗");

  // capacity
  if (g.chars.length > size) v.push("分组人数超限");

  // ability duplicates beyond cap
  for (const [ability, count] of g.abilityCount) {
    const cap = perAbilityMax.get(ability) ?? 2;
    if (count > cap) v.push(`技能 ${ability} 超额: ${count}/${cap}`);
  }

  return v;
}

function scoreGroupForChar(
  g: InternalGroup,
  c: Character,
  targeted: AbilityCheck[],
  groupSize: number,
  perAbilityMax: Map<string, number>
): number {
  let s = 0;

  // 1) Healer into groups without a healer
  if (c.role === "Healer" && !g.hasHealer) s += 1000;

  // 2) New coverage / useful contribution
  for (const a of targeted) {
    const can = hasAtLevel(c, a);
    if (!can) continue;

    const have = g.abilityCount.get(a.name) ?? 0;
    const cap = perAbilityMax.get(a.name) ?? 2;

    if (!groupHasAbility(g, a)) s += 200;
    else if (have < cap) s += 30;
  }

  // 3) Prefer groups with more free slots
  s += freeSlots(g, groupSize);

  return s;
}

// ---------- main ----------
export function runSolver(
  characters: Character[],
  checkedAbilities: AbilityCheck[],
  groupSize = 3
): GroupResult[] {
  const people = [...characters];
  const groupsCount = Math.max(1, Math.ceil(people.length / groupSize));

  const groups: InternalGroup[] = Array.from({ length: groupsCount }, () => ({
    chars: [],
    accounts: new Set(),
    hasHealer: false,
    abilityCount: new Map(),
  }));

  // only target abilities that are available this week
  const targeted = checkedAbilities.filter((a) => a.available);

  // fixed caps: every targeted ability max 2 per group
  const perAbilityMax = new Map<string, number>();
  for (const a of targeted) {
    perAbilityMax.set(a.name, 2);
  }

  // Utility: can place?
  const canPlace = (g: InternalGroup, c: Character) => {
    if (freeSlots(g, groupSize) <= 0) return false;
    if (g.accounts.has(c.account)) return false;

    for (const a of targeted) {
      if (!hasAtLevel(c, a)) continue;
      const next = (g.abilityCount.get(a.name) ?? 0) + 1;
      const cap = perAbilityMax.get(a.name) ?? 2;
      if (next > cap) return false;
    }
    return true;
  };

  // greedy chooser
  const placeGreedy = (c: Character) => {
    const scored = groups
      .map((g, i) => ({
        i,
        score: scoreGroupForChar(g, c, targeted, groupSize, perAbilityMax),
      }))
      .sort((a, b) => b.score - a.score);

    for (const { i } of scored) {
      const g = groups[i];
      if (canPlace(g, c)) {
        addChar(g, c, targeted);
        return true;
      }
    }
    return false;
  };

  // 1) place healers first
  const healers = people.filter((p) => p.role === "Healer").sort(() => Math.random() - 0.5);
  for (const h of healers) {
    if (placeGreedy(h)) continue;
    const fallback = groups.find((g) => freeSlots(g, groupSize) > 0 && !g.accounts.has(h.account));
    if (fallback) addChar(fallback, h, targeted);
  }

  // 2) distribute carriers of targeted abilities
  const nonHealers = people.filter((p) => p.role !== "Healer").sort(() => Math.random() - 0.5);

  for (const a of targeted) {
    const carriers = nonHealers.filter((c) => hasAtLevel(c, a));

    for (const c of carriers) {
      if (groups.some((g) => g.chars.some((x) => x._id === c._id))) continue;

      if (placeGreedy(c)) continue;

      const fallback = groups.find((g) => freeSlots(g, groupSize) > 0 && !g.accounts.has(c.account));
      if (fallback) addChar(fallback, c, targeted);
    }
  }

  // 3) fill remaining
  const placed = new Set(groups.flatMap((g) => g.chars.map((x) => x._id)));
  const remaining = people.filter((p) => !placed.has(p._id)).sort(() => Math.random() - 0.5);
  for (const c of remaining) {
    if (placeGreedy(c)) continue;
    const fallback = groups.find((g) => freeSlots(g, groupSize) > 0 && !g.accounts.has(c.account));
    if (fallback) addChar(fallback, c, targeted);
  }

  // 4) evaluate
  const results: GroupResult[] = groups.map((g) => ({
    characters: g.chars,
    missingAbilities: evaluateMissing(g, targeted),
    violations: collectViolations(g, groupSize, perAbilityMax),
  }));

  return results;
}
