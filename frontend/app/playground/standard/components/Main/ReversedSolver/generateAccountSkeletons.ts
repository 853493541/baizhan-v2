// utils/generateAccountSkeletons.ts
export type Role = "DPS" | "Healer" | "Tank";

/** One character becomes one token. */
interface Token {
  account: string;
  role: Role;
}

/** Public shape kept for compatibility (now includes tokens). */
export interface AccountCapability {
  account: string;
  roles: Role[];        // unique roles this account can play
  capacity: number;     // number of characters
  tokens: Role[];       // one entry per character, preserving role counts
}

export interface GroupSlot {
  role: Role | "Flex";
  account: string;
}

export interface GroupSkeleton {
  index: number;
  slots: GroupSlot[];
  hasHealer: boolean;
}

export interface Skeleton {
  groups: GroupSkeleton[];
  groupsWithHealer: number;
}

/** Utility: convert raw characters → account capabilities with per-role tokens. */
export function toAccountCapabilities(characters: any[]): AccountCapability[] {
  const map = new Map<string, AccountCapability>();

  for (const c of characters || []) {
    const acc = (c.account ?? "(unknown)") as string;
    const role = (c.role as Role) ?? "DPS";

    if (!map.has(acc)) {
      map.set(acc, { account: acc, roles: [role], capacity: 1, tokens: [role] });
    } else {
      const entry = map.get(acc)!;
      if (!entry.roles.includes(role)) entry.roles.push(role);
      entry.capacity += 1;
      entry.tokens.push(role);
    }
  }
  return Array.from(map.values());
}

/**
 * Generate valid 3-person **account skeletons** from account capabilities,
 * using per-character tokens to respect capacity and role counts.
 *
 * Rules:
 * - numGroups = ceil(totalCharacters / 3)
 * - exactly 3 members per group (if feasible)
 * - ≥1 Healer per group when there are at least numGroups healer tokens
 * - no duplicate ACCOUNT inside one group
 * - global capacity respected automatically (tokens are consumed)
 */
export function generateAccountSkeletons(
  accounts: AccountCapability[],
  opts?: { groupSize?: number }
): Skeleton[] {
  const groupSize = opts?.groupSize ?? 3;
  if (!accounts?.length) return [];

  // Build token list (one token per character).
  const healerTokens: Token[] = [];
  const otherTokens: Token[] = [];
  for (const a of accounts) {
    for (const r of a.tokens) {
      const t: Token = { account: a.account, role: r };
      (r === "Healer" ? healerTokens : otherTokens).push(t);
    }
  }

  const totalChars = healerTokens.length + otherTokens.length;
  const numGroups = Math.ceil(totalChars / groupSize);

  // Init groups
  const groups: { index: number; members: Token[] }[] = Array.from(
    { length: numGroups },
    (_, i) => ({ index: i, members: [] })
  );

  // Helper: try to place a token into some group (round-robin start), enforcing:
  // - group has space
  // - no same account already in that group
  const tryPlace = (
    token: Token,
    start: number,
    requireHealerSlot?: boolean
  ): boolean => {
    for (let k = 0; k < numGroups; k++) {
      const gi = (start + k) % numGroups;
      const g = groups[gi];

      // if we're in "ensure one healer per group" phase, skip groups that already have a healer
      if (requireHealerSlot && g.members.some((m) => m.role === "Healer")) continue;

      if (
        g.members.length < groupSize &&
        !g.members.some((m) => m.account === token.account)
      ) {
        g.members.push(token);
        return true;
      }
    }
    return false;
  };

  // 1) Place one Healer per group when possible (round-robin)
  //    This consumes healer tokens; we DO NOT reuse accounts.
  let cursor = 0;
  if (healerTokens.length >= numGroups) {
    for (const ht of healerTokens.slice()) {
      if (groups.every((g) => g.members.some((m) => m.role === "Healer"))) break;
      const placed = tryPlace(ht, cursor, true);
      if (placed) {
        // consume this healer token
        const idx = healerTokens.indexOf(ht);
        if (idx >= 0) healerTokens.splice(idx, 1);
        cursor++;
      }
    }
  }

  // 2) Fill remaining slots with all remaining tokens (extra healers + others), round-robin
  const pool: Token[] = [...healerTokens, ...otherTokens];
  cursor = 0;
  for (const tk of pool) {
    const placed = tryPlace(tk, cursor);
    if (placed) cursor++;
  }

  // 3) If still not full (rare, because of heavy account collisions), try a second pass
  //    starting at different offsets to find legal positions.
  for (let offset = 0; offset < numGroups; offset++) {
    if (groups.every((g) => g.members.length >= groupSize)) break;

    for (let i = pool.length - 1; i >= 0; i--) {
      const tk = pool[i];
      if (groups.every((g) => g.members.length >= groupSize)) break;
      const placed = tryPlace(tk, offset);
      if (placed) pool.splice(i, 1);
    }
  }

  // 4) Final check: are some groups still underfilled?
  //    (This can only happen if the dataset is infeasible, e.g., too few distinct accounts
  //     to fill 3 unique accounts per group.) We leave them as-is but DO NOT duplicate accounts.
  //    You can detect/report this in UI if needed.

  // Build structured skeleton
  const skeleton: Skeleton = {
    groups: groups.map((g) => ({
      index: g.index,
      slots: g.members.map((m) => ({ role: "Flex", account: m.account })),
      hasHealer: g.members.some((m) => m.role === "Healer"),
    })),
    groupsWithHealer: groups.filter((g) => g.members.some((m) => m.role === "Healer")).length,
  };

  return [skeleton];
}
