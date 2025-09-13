// utils/bossSolver.ts
export interface Character {
  _id: string;
  name: string;
  role: "DPS" | "Tank" | "Healer";
  abilities: string[];
  account: string;
}

export interface Group {
  index: number;
  characters: Character[];
  coveredAbilities: string[];
}

export interface SolverResult {
  success: boolean;
  groups: Group[];
  missing: string[];
  errors: string[];
}

interface BossSolverOptions {
  characters: Character[];
  groupSize: number;
  groupCount: number;
  flexRequired: string[];
  /** set to false to silence logs */
  debug?: boolean;
}

/**
 * Main Boss Solver with extensive debug logs
 */
export function bossSolver(options: BossSolverOptions): SolverResult {
  const {
    characters,
    groupSize,
    groupCount,
    flexRequired,
    debug = true,
  } = options;

  // ---- logging helpers ------------------------------------------------------
  const prefix = "[BossSolver]";
  const now = () =>
    (typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now()) as number;
  const t0 = now();

  const log = (...a: any[]) => debug && console.log(prefix, ...a);
  const dbg = (...a: any[]) => debug && console.debug(prefix, ...a);
  const warn = (...a: any[]) => debug && console.warn(prefix, ...a);
  const err = (...a: any[]) => debug && console.error(prefix, ...a);

  // clone-safe snapshot for initial logging
  const safe = <T>(v: T): T => JSON.parse(JSON.stringify(v));

  dbg("▶️ Received options:", safe({ groupSize, groupCount, flexRequired }));
  dbg(
    "👥 Characters (count =",
    characters.length,
    "):",
    safe(
      characters.map((c) => ({
        _id: c._id,
        name: c.name,
        role: c.role,
        account: c.account,
        abilities: c.abilities,
      }))
    )
  );

  // ---- pre-validations & diagnostics ---------------------------------------
  const errors: string[] = [];

  if (!Array.isArray(characters) || characters.length === 0) {
    errors.push("角色列表为空");
    err("角色列表为空");
  }
  if (!Number.isFinite(groupSize) || groupSize <= 0) {
    errors.push("groupSize 必须为正整数");
    err("groupSize 非法:", groupSize);
  }
  if (!Number.isFinite(groupCount) || groupCount <= 0) {
    errors.push("groupCount 必须为正整数");
    err("groupCount 非法:", groupCount);
  }
  if (!Array.isArray(flexRequired)) {
    errors.push("flexRequired 必须为字符串数组");
    err("flexRequired 非法:", flexRequired);
  }

  // quick role stats
  const roleCounts = characters.reduce(
    (acc, c) => {
      acc[c.role] = (acc[c.role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  dbg("📊 Role counts:", safe(roleCounts));

  // healer diagnostics
  const healers = characters.filter((c) => c.role === "Healer");
  const healersWithYunhai = healers.filter((h) =>
    h.abilities.includes("云海听弦")
  );
  dbg(
    `🩹 Healers=${healers.length}, Healers with 云海听弦=${healersWithYunhai.length}`
  );
  if (healersWithYunhai.length === 0) {
    warn("没有任何治疗携带 云海听弦，几乎不可能满足规则 2");
  }

  // account collision diagnostics (global)
  const accountSeen = new Map<string, number>();
  for (const c of characters) {
    accountSeen.set(c.account, (accountSeen.get(c.account) || 0) + 1);
  }
  const duplicateAccounts = [...accountSeen.entries()].filter(
    ([, n]) => n > 1
  );
  if (duplicateAccounts.length > 0) {
    dbg(
      "👥 Duplicate account names detected (global, allowed across groups but not within the same group):",
      safe(duplicateAccounts)
    );
  }

  // global ability frequency (helpful for coverage debugging)
  const abilityFreq = new Map<string, number>();
  for (const c of characters) {
    for (const a of c.abilities) {
      abilityFreq.set(a, (abilityFreq.get(a) || 0) + 1);
    }
  }
  dbg(
    "🧰 Ability frequency (top 30 shown):",
    safe(
      [...abilityFreq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
    )
  );

  // rough feasibility checks
  if (characters.length < groupSize * groupCount) {
    warn(
      `候选角色数量不足：需要 ${groupSize * groupCount}，实际 ${characters.length}`
    );
  }
  if (errors.length > 0) {
    const covered: string[] = [];
    return {
      success: false,
      groups: [],
      missing: flexRequired.filter((a) => !covered.includes(a)),
      errors,
    };
  }

  // ---- solver core ----------------------------------------------------------
  const used = new Set<string>();
  const groups: Group[] = [];

  const stats = {
    combosTried: 0,
    combosRejected: 0,
    combosAccepted: 0,
    backtracks: 0,
  };

  function isGroupValid(group: Character[]): boolean {
    dbg(
      "🔍 Checking group:",
      safe(group.map((c) => `${c.name}(${c.role})@${c.account}`))
    );

    // Rule 1: must have at least 1 healer
    const healer = group.find((c) => c.role === "Healer");
    if (!healer) {
      dbg("❌ Group rejected: no healer");
      return false;
    } else {
      dbg("✅ Found healer:", healer.name, "abilities:", safe(healer.abilities));
    }

    // Rule 2: healer must carry 云海听弦
    if (!healer.abilities.includes("云海听弦")) {
      dbg("❌ Group rejected: healer missing 云海听弦");
      return false;
    }

    // Rule 3: no duplicate accounts inside the same group
    const accounts = group.map((c) => c.account);
    const uniqueAccounts = new Set(accounts);
    if (accounts.length !== uniqueAccounts.size) {
      dbg("❌ Group rejected: duplicate accounts in group", safe(accounts));
      return false;
    }

    // optional helper: show which flexRequired are covered by this group
    const groupAbilities = new Set(group.flatMap((c) => c.abilities));
    const flexCoveredHere = flexRequired.filter((a) => groupAbilities.has(a));
    dbg("🧩 Group covers flexRequired:", safe(flexCoveredHere));

    dbg("✅ Group accepted");
    return true;
  }

  // simple combinations generator (no logging inside to avoid log explosions)
  function* combinations(
    arr: Character[],
    k: number,
    offset = 0
  ): Generator<Character[]> {
    if (k === 0) {
      yield [];
      return;
    }
    for (let i = offset; i <= arr.length - k; i++) {
      for (const rest of combinations(arr, k - 1, i + 1)) {
        yield [arr[i], ...rest];
      }
    }
  }

  function backtrack(startIndex: number, groupIndex: number): boolean {
    if (groupIndex === groupCount) {
      dbg("🎉 All groups assigned successfully");
      return true;
    }

    const remaining = characters.filter((c) => !used.has(c._id));
    dbg(
      `➡️ Backtrack group ${groupIndex + 1}/${groupCount}, remaining(${
        remaining.length
      }):`,
      safe(remaining.map((c) => `${c.name}(${c.role})@${c.account}`))
    );

    let attempt = 0;
    for (const combo of combinations(remaining, groupSize)) {
      attempt++;
      stats.combosTried++;
      dbg(
        `🧪 Try #${attempt} for group ${groupIndex + 1}:`,
        safe(combo.map((c) => `${c.name}(${c.role})`))
      );

      if (!isGroupValid(combo)) {
        stats.combosRejected++;
        continue;
      }

      // mark used
      combo.forEach((c) => used.add(c._id));
      const coveredAbilities = combo.flatMap((c) => c.abilities);
      const newGroup: Group = {
        index: groupIndex + 1,
        characters: combo,
        coveredAbilities,
      };
      groups.push(newGroup);
      stats.combosAccepted++;

      dbg(
        `📎 Group ${groupIndex + 1} formed:`,
        safe({
          index: newGroup.index,
          members: newGroup.characters.map((c) => c.name),
          coveredAbilities,
        })
      );

      if (backtrack(startIndex, groupIndex + 1)) {
        return true; // success
      }

      // backtrack
      stats.backtracks++;
      dbg(
        `↩️ Backtracking from group ${groupIndex + 1}. Removing:`,
        safe(combo.map((c) => c.name))
      );
      groups.pop();
      combo.forEach((c) => used.delete(c._id));
    }
    return false;
  }

  const success = backtrack(0, 0);

  // ---- coverage & summary ---------------------------------------------------
  const covered = groups.flatMap((g) => g.coveredAbilities);
  const coveredSet = new Set(covered);
  const missing = flexRequired.filter((a) => !coveredSet.has(a));

  // show coverage counts
  const coveredCounts = covered.reduce((m, a) => {
    m[a] = (m[a] || 0) + 1;
    return m;
  }, {} as Record<string, number>);

  dbg("🧮 Covered ability counts across all groups:", safe(coveredCounts));
  dbg("❗ Missing flexRequired:", safe(missing));

  const t1 = now();
  log("⏱️ Timing(ms):", Math.round(t1 - t0));
  log("📈 Stats:", safe(stats));

  const finalErrors = [...errors];
  if (!success) finalErrors.push("无法找到满足条件的分组");
  if (missing.length > 0) finalErrors.push("缺少必需技能: " + missing.join("，"));

  dbg("📊 Solver finished", safe({ success, groups, missing, finalErrors }));

  return {
    success: success && missing.length === 0,
    groups,
    missing,
    errors: finalErrors,
  };
}
