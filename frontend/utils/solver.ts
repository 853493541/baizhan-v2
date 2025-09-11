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
  abilityCount: Map<string, number>; // ability -> count
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

function groupHasAbility(g: InternalGroup, a: AbilityCheck) {
  return (g.abilityCount.get(a.name) ?? 0) > 0;
}

function evaluateMissing(g: InternalGroup, targeted: AbilityCheck[]) {
  return targeted.filter((a) => !groupHasAbility(g, a));
}

function addCharAndBumpCounts(
  g: InternalGroup,
  c: Character,
  targeted: AbilityCheck[],
  bump: (ability: string) => void
) {
  g.chars.push(c);
  g.accounts.add(c.account);
  if (c.role === "Healer") g.hasHealer = true;
  for (const a of targeted) {
    if (hasAtLevel(c, a)) {
      const next = (g.abilityCount.get(a.name) ?? 0) + 1;
      g.abilityCount.set(a.name, next);
      bump(a.name);
    }
  }
}

// Fisher–Yates shuffle
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

// ---------- main ----------
export function runSolver(
  characters: Character[],
  checkedAbilities: AbilityCheck[],
  groupSize = 3
): GroupResult[] {
  const people = [...characters];
  const groupsCount = Math.max(1, Math.ceil(people.length / groupSize));
  const targeted = checkedAbilities.filter((a) => a.available);

  // Fixed caps: always 2 per group for targeted abilities
  const perAbilityMax = new Map<string, number>();
  for (const a of targeted) perAbilityMax.set(a.name, 2);

  // Allowed conflicts per ability (minimum mathematically required)
  const allowedConflicts = new Map<string, number>();
  for (const a of targeted) {
    const totalCarriers = people.filter((c) => hasAtLevel(c, a)).length;
    const capacity = groupsCount * 2; // 2 per group
    const allowed = Math.max(0, totalCarriers - capacity);
    allowedConflicts.set(a.name, allowed);
  }

  // Try multiple randomized attempts to find a legal arrangement
  const MAX_ATTEMPTS = 60;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const usedConflicts = new Map<string, number>();
    for (const a of targeted) usedConflicts.set(a.name, 0);

    const groups: InternalGroup[] = cloneEmptyGroups(groupsCount);

    // Order:
    const healers = shuffle(people.filter((p) => p.role === "Healer").slice());
    const nonHealers = shuffle(people.filter((p) => p.role !== "Healer").slice());

    const carriersByAbility: Map<string, Character[]> = new Map();
    for (const a of targeted) {
      carriersByAbility.set(
        a.name,
        nonHealers.filter((c) => hasAtLevel(c, a))
      );
    }

    const placed = new Set<string>();

    const canConsumeOverflow = (ability: string) => {
      const allowed = allowedConflicts.get(ability) ?? 0;
      const used = usedConflicts.get(ability) ?? 0;
      return used < allowed;
    };

    const canPlace = (g: InternalGroup, c: Character): boolean => {
      if (freeSlots(g, groupSize) <= 0) return false;
      if (g.accounts.has(c.account)) return false;

      for (const a of targeted) {
        if (!hasAtLevel(c, a)) continue;
        const have = g.abilityCount.get(a.name) ?? 0;
        const cap = perAbilityMax.get(a.name)!;
        const next = have + 1;
        if (next > cap && !canConsumeOverflow(a.name)) {
          return false;
        }
      }
      return true;
    };

    const addChar = (g: InternalGroup, c: Character) => {
      addCharAndBumpCounts(g, c, targeted, (ability) => {
        const have = g.abilityCount.get(ability)!;
        const cap = perAbilityMax.get(ability)!;
        if (have > cap) {
          usedConflicts.set(ability, (usedConflicts.get(ability) ?? 0) + 1);
        }
      });
      placed.add(c._id);
    };

    const scoreGroupForChar = (g: InternalGroup, c: Character): number => {
      let s = 0;
      if (c.role === "Healer" && !g.hasHealer) s += 1000;

      for (const a of targeted) {
        if (!hasAtLevel(c, a)) continue;
        const have = g.abilityCount.get(a.name) ?? 0;
        const cap = perAbilityMax.get(a.name)!;
        if (have === 0) s += 200;
        else if (have < cap) s += 30;
      }

      s += freeSlots(g, groupSize);
      return s;
    };

    const placeGreedy = (c: Character): boolean => {
      const ranked = groups
        .map((g, i) => ({ i, score: scoreGroupForChar(g, c) }))
        .sort((a, b) => b.score - a.score);

      for (const { i } of ranked) {
        const g = groups[i];
        if (canPlace(g, c)) {
          addChar(g, c);
          return true;
        }
      }
      return false;
    };

    // 1) place healers
    for (const h of healers) {
      if (!placeGreedy(h)) {
        continue; // let this attempt fail
      }
    }

    // 2) distribute carriers of targeted abilities
    for (const a of targeted) {
      const carriers = shuffle((carriersByAbility.get(a.name) ?? []).slice());
      for (const c of carriers) {
        if (placed.has(c._id)) continue;
        placeGreedy(c); // skip if cannot place (retry in another attempt)
      }
    }

    // 3) remaining characters
    const remaining = shuffle(
      people.filter((p) => !placed.has(p._id))
    );
    let stuck = false;
    for (const c of remaining) {
      if (!placeGreedy(c)) {
        stuck = true;
        break;
      }
    }
    if (stuck) continue; // try next attempt

    // Build results
    const results: GroupResult[] = groups.map((g) => {
      const v: string[] = [];

      if (!g.hasHealer) v.push("缺少治疗");

      const seen = new Set<string>();
      const dups = new Set<string>();
      for (const c of g.chars) {
        if (seen.has(c.account)) dups.add(c.account);
        seen.add(c.account);
      }
      if (dups.size > 0) v.push(`重复账号: ${Array.from(dups).join("、")}`);

      for (const [ability, count] of g.abilityCount) {
        const cap = perAbilityMax.get(ability)!;
        if (count > cap) {
          const used = usedConflicts.get(ability) ?? 0;
          const allowed = allowedConflicts.get(ability) ?? 0;
          if (used > allowed) {
            v.push(`技能 ${ability} 超额: ${count}/${cap}`);
          }
        }
      }

      return {
        characters: g.chars,
        missingAbilities: evaluateMissing(g, targeted),
        violations: v,
      };
    });

    return results;
  }

  // Fallback: if all attempts failed
  const fallbackGroups: InternalGroup[] = cloneEmptyGroups(
    Math.max(1, Math.ceil(people.length / groupSize))
  );

  const usedConflicts = new Map<string, number>();
  for (const a of targeted) usedConflicts.set(a.name, 0);

  const addCharFallback = (g: InternalGroup, c: Character) => {
    addCharAndBumpCounts(g, c, targeted, (ability) => {
      const have = g.abilityCount.get(ability)!;
      const cap = perAbilityMax.get(ability)!;
      if (have > cap) {
        usedConflicts.set(ability, (usedConflicts.get(ability) ?? 0) + 1);
      }
    });
  };

  const scoreGroupForCharFallback = (g: InternalGroup, c: Character) => {
    let s = 0;
    if (c.role === "Healer" && !g.hasHealer) s += 1000;
    for (const a of targeted) {
      if (!hasAtLevel(c, a)) continue;
      const have = g.abilityCount.get(a.name) ?? 0;
      const cap = perAbilityMax.get(a.name)!;
      if (have === 0) s += 200;
      else if (have < cap) s += 30;
    }
    s += freeSlots(g, groupSize);
    return s;
  };

  const order = shuffle(people.slice());
  for (const c of order) {
    const ranked = fallbackGroups
      .map((g, i) => ({ i, score: scoreGroupForCharFallback(g, c) }))
      .sort((a, b) => b.score - a.score);
    for (const { i } of ranked) {
      const g = fallbackGroups[i];
      if (freeSlots(g, groupSize) > 0 && !g.accounts.has(c.account)) {
        addCharFallback(g, c);
        break;
      }
    }
  }

  const fallbackResults: GroupResult[] = fallbackGroups.map((g) => {
    const v: string[] = [];
    if (!g.hasHealer) v.push("缺少治疗");
    const seen = new Set<string>();
    const dups = new Set<string>();
    for (const c of g.chars) {
      if (seen.has(c.account)) dups.add(c.account);
      seen.add(c.account);
    }
    if (dups.size > 0) v.push(`重复账号: ${Array.from(dups).join("、")}`);
    for (const [ability, count] of g.abilityCount) {
      const cap = perAbilityMax.get(ability)!;
      if (count > cap) v.push(`技能 ${ability} 超额: ${count}/${cap}`);
    }
    return { characters: g.chars, missingAbilities: evaluateMissing(g, targeted), violations: v };
  });

  return fallbackResults;
}
