// useAbilityHistory.ts
import { useEffect, useMemo, useState } from "react";
import { createPinyinMap, pinyinFilter } from "@/utils/pinyinSearch";
import { toastError, toastSuccess } from "@/app/components/toast/toast";
import type { GroupedItem, HistoryItem } from "./Components/GroupedResult";

/* ===============================
   Constants
=============================== */
const GROUP_WINDOW = 10_000; // 10s
const MIN_GROUP_SIZE = 6;

/* ===============================
   Utils
=============================== */
const time = (d: string) => new Date(d).getTime();
const isSameAbilityOnly = (records: HistoryItem[]) => {
  const set = new Set(records.map((r) => r.abilityName));
  return set.size === 1;
};

/* ===============================
   Step 1: ability chains (small groups)
   same char + same ability + within 10s
=============================== */
function extractAbilityChains(items: HistoryItem[]) {
  const used = new Set<string>();
  const chains: HistoryItem[][] = [];

  // items are already within the same character window (same char)
  for (const base of items) {
    if (used.has(base._id)) continue;

    const chain = items.filter(
      (x) =>
        x.characterName === base.characterName &&
        x.abilityName === base.abilityName &&
        Math.abs(time(x.updatedAt) - time(base.updatedAt)) <= GROUP_WINDOW
    );

    if (chain.length > 1) {
      chain.forEach((x) => used.add(x._id));
      chains.push(chain.sort((a, b) => time(a.updatedAt) - time(b.updatedAt)));
    }
  }

  return {
    chains,
    remaining: items.filter((x) => !used.has(x._id)),
  };
}

/* ===============================
   Step 2: split by time window per character
=============================== */
function splitTimeWindows(items: HistoryItem[]): HistoryItem[][] {
  const windows: HistoryItem[][] = [];
  let current: HistoryItem[] = [];

  for (const item of items) {
    if (
      !current.length ||
      item.characterName !== current[0].characterName ||
      time(item.updatedAt) - time(current[current.length - 1].updatedAt) >
        GROUP_WINDOW
    ) {
      if (current.length) windows.push(current);
      current = [item];
    } else {
      current.push(item);
    }
  }

  if (current.length) windows.push(current);
  return windows;
}

/* ===============================
   Final grouping
=============================== */
function groupHistory(items: HistoryItem[]): GroupedItem[] {
  if (!items.length) return [];

  const sorted = [...items].sort((a, b) => time(a.updatedAt) - time(b.updatedAt));

  const result: GroupedItem[] = [];
  const windows = splitTimeWindows(sorted);

  for (const window of windows) {
    // 1) chains
    const { chains, remaining } = extractAbilityChains(window);

    for (const chain of chains) {
      result.push({
        groupId: `chain-${chain[0]._id}`,
        characterName: chain[0].characterName,
        // use latest time so sorting works
        updatedAt: chain[chain.length - 1].updatedAt,
        records: chain,
        isBatch: false,
      });
    }

    // 2) remaining
    if (!remaining.length) continue;

    const abilitySet = new Set(remaining.map((r) => r.abilityName));

    if (remaining.length >= MIN_GROUP_SIZE && abilitySet.size > 1) {
      result.push({
        groupId: `batch-${remaining[0]._id}`,
        characterName: remaining[0].characterName,
        updatedAt: remaining[remaining.length - 1].updatedAt,
        records: remaining.sort((a, b) => time(a.updatedAt) - time(b.updatedAt)),
        isBatch: true,
      });
    } else {
      for (const r of remaining) {
        result.push({
          groupId: `single-${r._id}`,
          characterName: r.characterName,
          updatedAt: r.updatedAt,
          records: [r],
          isBatch: false,
        });
      }
    }
  }

  return result.sort((a, b) => time(b.updatedAt) - time(a.updatedAt));
}

/* ===============================
   Hook
=============================== */
export function useAbilityHistory() {
  const [rawData, setRawData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterName, setFilterName] = useState("");
  const [filterAbility, setFilterAbility] = useState("");

  type DaysRange = "all" | 1 | 30 | 60 | 90;
  const [days, setDays] = useState<DaysRange>(30);

  const [importantOnly, setImportantOnly] = useState(false);

  const [nameMap, setNameMap] = useState<Record<string, any>>({});
  const [abilityMap, setAbilityMap] = useState<Record<string, any>>({});

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] =
    useState<(() => void) | null>(null);

  /* ===============================
     Fetch
  =============================== */
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const basePath = importantOnly
        ? "/api/characters/abilities/history/important"
        : "/api/characters/abilities/history";

      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}${basePath}`);
      if (days !== "all") url.searchParams.set("days", String(days));

      const res = await fetch(url.toString());
      const json: HistoryItem[] = await res.json();

      setRawData(json);

      const names = [...new Set(json.map((x) => x.characterName))];
      const abilities = [...new Set(json.map((x) => x.abilityName))];

      const [nm, am] = await Promise.all([
        createPinyinMap(names),
        createPinyinMap(abilities),
      ]);

      setNameMap(nm);
      setAbilityMap(am);
    } catch (e) {
      console.error(e);
      toastError("获取技能记录失败");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     Derived
  =============================== */
  const groupedData = useMemo(() => {
    let filtered = rawData;

    if (filterName.trim()) {
      const matched = pinyinFilter(
        [...new Set(rawData.map((x) => x.characterName))],
        nameMap,
        filterName.trim()
      );
      filtered = filtered.filter((x) => matched.includes(x.characterName));
    }

    if (filterAbility.trim()) {
      const matched = pinyinFilter(
        [...new Set(rawData.map((x) => x.abilityName))],
        abilityMap,
        filterAbility.trim()
      );
      filtered = filtered.filter((x) => matched.includes(x.abilityName));
    }

    return groupHistory(filtered);
  }, [rawData, filterName, filterAbility, nameMap, abilityMap]);

  /* ===============================
     Revert helpers
  =============================== */
  async function revertOneRecord(id: string) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/characters/abilities/history/${id}/revert`,
      { method: "POST" }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `revert failed: ${id}`);
    }
  }

  async function revertChainInOrder(records: HistoryItem[]) {
    // latest -> earliest (10->9->8...)
    const ordered = [...records].sort((a, b) => time(b.updatedAt) - time(a.updatedAt));
    for (const r of ordered) {
      await revertOneRecord(r._id);
    }
  }

  /* ===============================
     Revert actions
  =============================== */
  const revertSingle = (id: string, item: HistoryItem) => {
    setConfirmMessage(
      `确认将 ${item.characterName} 的 ${item.abilityName} 撤回到 ${item.beforeLevel}重 吗？`
    );

    setOnConfirmAction(() => async () => {
      try {
        await revertOneRecord(id);
        toastSuccess("撤回成功");
        fetchHistory();
      } catch (e) {
        console.error(e);
        toastError("撤回失败");
      } finally {
        setConfirmOpen(false);
      }
    });

    setConfirmOpen(true);
  };

  const revertGroup = (group: GroupedItem) => {
    const records = group.records || [];

    const isChain =
      group.groupId?.startsWith("chain-") ||
      (!group.isBatch && records.length > 1 && isSameAbilityOnly(records));

    // ✅ SMALL GROUP (chain): must revert sequentially
    if (isChain) {
      setConfirmMessage(
        `确定要按顺序撤回 ${group.characterName} 的 ${records.length} 次更新吗？`
      );

      setOnConfirmAction(() => async () => {
        try {
          await revertChainInOrder(records);
          toastSuccess("已按顺序撤回");
          fetchHistory();
        } catch (e) {
          console.error(e);
          toastError("撤回失败");
        } finally {
          setConfirmOpen(false);
        }
      });

      setConfirmOpen(true);
      return;
    }

    // ✅ BIG GROUP (batch)
    setConfirmMessage(
      `确定要撤回 ${group.characterName} 的 ${records.length} 项技能吗？`
    );

    setOnConfirmAction(() => async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/characters/abilities/history/batch/revert`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: records.map((r) => r._id) }),
          }
        );

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || "batch revert failed");
        }

        toastSuccess("批量撤回成功");
        fetchHistory();
      } catch (e) {
        console.error(e);
        toastError("批量撤回失败");
      } finally {
        setConfirmOpen(false);
      }
    });

    setConfirmOpen(true);
  };

  useEffect(() => {
    fetchHistory();
  }, [days, importantOnly]);

  return {
    loading,
    groupedData,

    filterName,
    setFilterName,
    filterAbility,
    setFilterAbility,

    days,
    setDays,

    importantOnly,
    setImportantOnly,

    refresh: fetchHistory,
    revertSingle,
    revertGroup,

    confirmOpen,
    confirmMessage,
    onConfirmAction,
    closeConfirm: () => {
      setConfirmOpen(false);
      setOnConfirmAction(null);
    },
  };
}
