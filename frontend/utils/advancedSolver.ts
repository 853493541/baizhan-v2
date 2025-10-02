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

function addCharAndBumpCounts(
  g: InternalGroup,
  c: Character,
  targeted: AbilityCheck[],
  bump: (abilityKey: string) => void
) {
  g.chars.push(c);
  g.accounts.add(c.account);
  if (c.role === "Healer") g.hasHealer = true;
  for (const a of targeted) {
    if (hasAtLevel(c, a)) {
      const key = keyOf(a);
      const next = (g.abilityCount.get(key) ?? 0) + 1;
      g.abilityCount.set(key, next);
      bump(key);
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
export function runAdvancedSolver(
  characters: Character[],
  checkedAbilities: AbilityCheck[],
  groupSize = 3
): GroupResult[] {
  console.log("[advanced solver] starting run...");
  console.log("[advanced solver] characters:", characters.map((c) => c.name));
  console.log("[advanced solver] abilities:", checkedAbilities);

  const people = [...characters];
  const groupsCount = Math.max(1, Math.ceil(people.length / groupSize));
  const targeted = checkedAbilities.filter((a) => a.available);

  // caps: 2 per abilityKey per group
  const perAbilityMax = new Map<string, number>();
  for (const a of targeted) perAbilityMax.set(keyOf(a), 2);

  // allowed conflicts per abilityKey
  const allowedConflicts = new Map<string, number>();
  for (const a of targeted) {
    const key = keyOf(a);
    const totalCarriers = people.filter((c) => hasAtLevel(c, a)).length;
    const capacity = groupsCount * 2;
    const allowed = Math.max(0, totalCarriers - capacity);
    allowedConflicts.set(key, allowed);
  }

  // ✅ hard cap at 100
  const MAX_ATTEMPTS = 1600;
  console.log("[advanced solver] max attempts =", MAX_ATTEMPTS);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const usedConflicts = new Map<string, number>();
    for (const a of targeted) usedConflicts.set(keyOf(a), 0);

    const groups: InternalGroup[] = cloneEmptyGroups(groupsCount);

    const healers = shuffle(people.filter((p) => p.role === "Healer").slice());
    const nonHealers = shuffle(people.filter((p) => p.role !== "Healer").slice());

    const carriersByAbility: Map<string, Character[]> = new Map();
    for (const a of targeted) {
      carriersByAbility.set(
        keyOf(a),
        nonHealers.filter((c) => hasAtLevel(c, a))
      );
    }

    const placed = new Set<string>();

    const canConsumeOverflow = (abilityKey: string) => {
      const allowed = allowedConflicts.get(abilityKey) ?? 0;
      const used = usedConflicts.get(abilityKey) ?? 0;
      return used < allowed;
    };

    const canPlace = (g: InternalGroup, c: Character): boolean => {
      if (freeSlots(g, groupSize) <= 0) return false;
      if (g.accounts.has(c.account)) return false;

      for (const a of targeted) {
        if (!hasAtLevel(c, a)) continue;
        const key = keyOf(a);
        const have = g.abilityCount.get(key) ?? 0;
        const cap = perAbilityMax.get(key)!;
        if (have + 1 > cap && !canConsumeOverflow(key)) {
          return false;
        }
      }
      return true;
    };

    const addChar = (g: InternalGroup, c: Character) => {
      addCharAndBumpCounts(g, c, targeted, (abilityKey) => {
        const have = g.abilityCount.get(abilityKey)!;
        const cap = perAbilityMax.get(abilityKey)!;
        if (have > cap) {
          usedConflicts.set(abilityKey, (usedConflicts.get(abilityKey) ?? 0) + 1);
        }
      });
      placed.add(c._id);
    };

    const scoreGroupForChar = (g: InternalGroup, c: Character): number => {
      let s = 0;
      if (c.role === "Healer" && !g.hasHealer) s += 1000;
      for (const a of targeted) {
        if (!hasAtLevel(c, a)) continue;
        const key = keyOf(a);
        const have = g.abilityCount.get(key) ?? 0;
        const cap = perAbilityMax.get(key)!;
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

    // place healers
    for (const h of healers) placeGreedy(h);

    // distribute ability carriers
    for (const a of targeted) {
      const key = keyOf(a);
      const carriers = shuffle((carriersByAbility.get(key) ?? []).slice());
      for (const c of carriers) {
        if (placed.has(c._id)) continue;
        placeGreedy(c);
      }
    }

    // place remaining
    let stuck = false;
    for (const c of shuffle(people.filter((p) => !placed.has(p._id)))) {
      if (!placeGreedy(c)) {
        stuck = true;
        break;
      }
    }
    if (stuck) continue;

    console.log("[advanced solver] success on attempt", attempt + 1);

    // build results
    return groups.map((g, i) => {
      const v: string[] = [];
      if (!g.hasHealer) v.push("缺少治疗");

      const seen = new Set<string>();
      const dups = new Set<string>();
      for (const c of g.chars) {
        if (seen.has(c.account)) dups.add(c.account);
        seen.add(c.account);
      }
      if (dups.size > 0) v.push(`重复账号: ${Array.from(dups).join("、")}`);

      for (const [abilityKey, count] of g.abilityCount) {
        const cap = perAbilityMax.get(abilityKey)!;
        if (count > cap) {
          const used = usedConflicts.get(abilityKey) ?? 0;
          const allowed = allowedConflicts.get(abilityKey) ?? 0;
          if (used > allowed) v.push(`技能 ${abilityKey} 超额: ${count}/${cap}`);
        }
      }

      return {
        characters: g.chars,
        missingAbilities: evaluateMissing(g, targeted),
        violations: v,
      };
    });
  }

  console.warn("[advanced solver] all attempts failed, falling back.");

  // fallback: sequential fill
  const fallbackGroups = cloneEmptyGroups(groupsCount);
  let idx = 0;
  for (const c of people) {
    fallbackGroups[idx % groupsCount].chars.push(c);
    idx++;
  }
  return fallbackGroups.map((g) => ({
    characters: g.chars,
    missingAbilities: evaluateMissing(g, targeted),
    violations: !g.hasHealer ? ["缺少治疗"] : [],
  }));
}
