"use client";

import { useEffect, useState, useMemo } from "react";
import styles from "./styles.module.css";
import { runAdvancedSolver } from "@/utils/advancedSolver";
import { summarizeAftermath } from "@/utils/aftermathSummary";
import type { GroupResult, Character, AbilityCheck } from "@/utils/solver";

import SolverButtons from "./SolverButtons";
import DisplayGroups from "./DisplayGroups";
import EditAllGroupsModal from "./EditAllGroupsModal";
import ControlBar from "./ControlBar";

import { toastError, toastSuccess } from "@/app/components/toast/toast";

/* 🔥 ORDERED main character priority */
const MAIN_CHARACTERS = [
  "剑心猫猫糕",
  "五溪",
  "东海甜妹",
  "饲猫大桔",
  "唐宵风",
] as const;

const MAIN_ORDER_MAP = new Map(MAIN_CHARACTERS.map((name, idx) => [name, idx]));

type AnyCharRef = any;

function getCharId(ref: AnyCharRef): string | null {
  if (!ref) return null;
  if (typeof ref === "string") return ref;
  if (typeof ref === "object" && typeof ref._id === "string") return ref._id;
  return null;
}

/* =========================
   Temp cache type
========================= */
type CachedGroups = {
  id: number;
  groups: GroupResult[];
  createdAt: number;
};

const CACHE_CAP = 10;

interface Props {
  schedule: {
    _id: string;
    server: string;
    conflictLevel: number;
    characters: Character[];
    checkedAbilities: AbilityCheck[];
  };
  groups: GroupResult[];
  setGroups: (groups: GroupResult[]) => void;
  activeIdx: number | null;
  setActiveIdx: (idx: number | null) => void;
  checkGroupQA: (
    group: GroupResult,
    conflictLevel: number,
    checkedAbilities: AbilityCheck[]
  ) => string[];
}

export default function MainSection({
  schedule,
  groups,
  setGroups,
  activeIdx,
  setActiveIdx,
  checkGroupQA,
}: Props) {
  const [solving, setSolving] = useState(false);
  const [aftermath, setAftermath] = useState<{
    wasted9: number;
    wasted10: number;
  } | null>(null);
  const [showEditAll, setShowEditAll] = useState(false);

  /* =========================
     🔐 TEMP GROUP CACHE (holes allowed)
  ========================= */
  const [groupCache, setGroupCache] = useState<(CachedGroups | undefined)[]>([]);

  const saveToCache = () => {
    if (!groups.length) {
      toastError("当前没有排表可保存");
      return;
    }

    setGroupCache((prev) => {
      const next = [...prev];
      const emptyIdx = next.findIndex((v) => !v);

      const entry: CachedGroups = {
        id: Date.now(),
        groups: structuredClone(groups),
        createdAt: Date.now(),
      };

      if (emptyIdx !== -1) {
        next[emptyIdx] = entry;
      } else if (next.length < CACHE_CAP) {
        next.push(entry);
      } else {
        next.shift();
        next.push(entry);
      }

      return next;
    });

    toastSuccess("排表已暂时保存");
  };

  const restoreFromCache = async (idx: number) => {
    const cached = groupCache[idx];
    if (!cached) return;

    const restored = structuredClone(cached.groups);
    setGroups(restored);
    await saveGroups(restored);

    toastSuccess(`已恢复并保存暂存排表 ${idx + 1}`);
  };

  const deleteCache = (idx: number) => {
    setGroupCache((prev) => {
      const next = [...prev];
      next[idx] = undefined; // ⭐ hole, no shift
      return next;
    });

    toastSuccess(`已删除暂存排表 ${idx + 1}`);
  };

  /* =========================
     Solver ability toggles
  ========================= */
  const allAbilities = schedule.checkedAbilities;
  const keyFor = (a: AbilityCheck) => `${a.name}-${a.level}`;

  const [enabledAbilities, setEnabledAbilities] = useState<Record<string, boolean>>(
    () => Object.fromEntries(allAbilities.map((a) => [keyFor(a), true]))
  );

  const effectiveAbilities: AbilityCheck[] = useMemo(
    () =>
      allAbilities.map((a) => ({
        ...a,
        available: enabledAbilities[keyFor(a)] ?? true,
      })),
    [allAbilities, enabledAbilities]
  );

  /* =========================
     Aftermath summary
  ========================= */
  useEffect(() => {
    if (!groups.length) {
      setAftermath(null);
      return;
    }

    summarizeAftermath(groups).then(setAftermath).catch(() => setAftermath(null));
  }, [groups]);

  /* =========================
     Save groups (IDs only)
  ========================= */
  const saveGroups = async (results: GroupResult[]) => {
    const payload = results.map((g, idx) => ({
      index: idx + 1,
      characters: (g.characters as AnyCharRef[])
        .map(getCharId)
        .filter(Boolean),
    }));

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/standard-schedules/${schedule._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groups: payload }),
        }
      );
    } catch (err) {
      console.error("❌ Save error:", err);
    }
  };

  /* =========================
     Reordering
  ========================= */
  const reorderGroups = (inputGroups: GroupResult[]) => {
    const getPriority = (g: GroupResult) => {
      let best = Infinity;
      for (const c of g.characters as any[]) {
        const order = MAIN_ORDER_MAP.get(c?.name);
        if (order !== undefined) best = Math.min(best, order);
      }
      return best;
    };

    const main = inputGroups
      .map((g) => ({ g, p: getPriority(g) }))
      .filter(({ p }) => p !== Infinity)
      .sort((a, b) => a.p - b.p)
      .map(({ g }) => g);

    const rest = inputGroups.filter(
      (g) => !(g.characters as any[]).some((c) => MAIN_ORDER_MAP.has(c?.name))
    );

    return [...main, ...rest].map((g, idx) => ({
      ...g,
      index: idx + 1,
    }));
  };

  /* =========================
     Manual edit commit (FIX)
  ========================= */
  const commitManualEdit = async (next: GroupResult[]) => {
    // Normalize indexes (helps backend/consistent UI)
    const normalized = next.map((g, idx) => ({
      ...g,
      index: idx + 1,
      status: g.status ?? "not_started",
    }));

    setGroups(normalized);
    await saveGroups(normalized);
    // toastSuccess("手动编辑已保存");
  };

  /* =========================
     Solver
  ========================= */
  const safeRunSolver = async (abilities: AbilityCheck[]) => {
    if (solving) return;

    try {
      setSolving(true);
      await new Promise((r) => setTimeout(r, 0));

      const results = runAdvancedSolver(schedule.characters, abilities, 3);

      if (!Array.isArray(results) || results.length === 0) {
        toastError("排表失败，请重试");
        return;
      }

      toastSuccess("排表成功");

      const normalized = reorderGroups(results).map((g) => ({
        ...g,
        status: g.status ?? "not_started",
      }));

      setGroups(normalized);
      await saveGroups(normalized);
    } catch (err) {
      console.error("❌ Solver error:", err);
      toastError("排表失败，请重试");
    } finally {
      setSolving(false);
    }
  };

  const shouldLock = groups.some((g) => g.status !== "not_started");
  const finishedCount = groups.filter((g) => g.status === "finished").length;

  return (
    <div className={styles.section}>
      <ControlBar
        finished={finishedCount}
        total={groups.length}
        locked={shouldLock}
        onManualEdit={() => setShowEditAll(true)}
      />

      {groups.length > 0 && (
        <>
          <DisplayGroups
            groups={groups
              .map((g, i) => ({ g, i }))
              .filter(({ g }) =>
                g.characters.some((c: any) => MAIN_ORDER_MAP.has(c.name))
              )}
            setActiveIdx={setActiveIdx}
            checkGroupQA={checkGroupQA}
            conflictLevel={schedule.conflictLevel}
            checkedAbilities={effectiveAbilities}
          />

          <DisplayGroups
            groups={groups
              .map((g, i) => ({ g, i }))
              .filter(
                ({ g }) =>
                  !g.characters.some((c: any) => MAIN_ORDER_MAP.has(c.name))
              )}
            setActiveIdx={setActiveIdx}
            checkGroupQA={checkGroupQA}
            conflictLevel={schedule.conflictLevel}
            checkedAbilities={effectiveAbilities}
          />
        </>
      )}

      <SolverButtons
        solving={solving}
        disabled={shouldLock}
        onCore={() => safeRunSolver(effectiveAbilities)}
        onFull={() => safeRunSolver(allAbilities)}
        onEdit={() => setShowEditAll(true)}
        allAbilities={allAbilities.map((a) => ({
          name: a.name,
          level: a.level,
        }))}
        enabledAbilities={enabledAbilities}
        setEnabledAbilities={setEnabledAbilities}
        cache={groupCache}
        onSaveCache={saveToCache}
        onRestoreCache={restoreFromCache}
        onDeleteCache={deleteCache}
      />

      {showEditAll && (
        <EditAllGroupsModal
          groups={groups}
          scheduleId={schedule._id}
          existingCharacters={schedule.characters}
          onClose={() => setShowEditAll(false)}
          onSave={commitManualEdit} // ✅ IMPORTANT: persist to backend
        />
      )}
    </div>
  );
}
