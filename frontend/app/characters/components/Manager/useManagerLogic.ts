"use client";

import { useState, useEffect, useMemo } from "react";
import { createPinyinMap, pinyinFilter } from "../../../../utils/pinyinSearch";
import { toastError } from "@/app/components/toast/toast";
import bossData from "@/app/data/boss_drop.json";
import { numToChinese } from "./abilityUtils";

/* ===============================
   Types
=============================== */
export interface StorageItem {
  ability: string;
  level: number;
}

export interface Character {
  _id: string;
  name?: string;
  abilities?: Record<string, number>;
  storage?: StorageItem[];
}

/* ===============================
   Insert section ability pool
=============================== */
const ALL_ABILITIES: string[] = Array.from(
  new Set(Object.values(bossData).flat() as string[])
);

/* ===============================
   Hook
=============================== */
export function useManagerLogic(
  char: Character,
  API_URL: string,
  onUpdated: (c: Character) => void
) {
  const [localChar, setLocalChar] = useState<Character>(char);

  /* Section A */
  const [search, setSearch] = useState("");

  /* Section B */
  const [insertSearch, setInsertSearch] = useState("");

  const [loading, setLoading] = useState(false);

  /* Confirm modal */
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] =
    useState<(() => void) | null>(null);

  /* Pinyin map for storage */
  const [pinyinMap, setPinyinMap] = useState<
    Record<string, { full: string; short: string }>
  >({});

  useEffect(() => {
    async function buildMap() {
      const names = (localChar.storage || []).map((s) => s.ability);
      const map = await createPinyinMap(names);
      setPinyinMap(map);
    }
    if (localChar.storage?.length) buildMap();
  }, [localChar]);

  /* ===============================
     Section A — storage filter
  =============================== */
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = localChar.storage || [];
    if (!q) return list;

    const names = list.map((it) => it.ability);
    const matched = pinyinFilter(names, pinyinMap, q);
    return list.filter((it) => matched.includes(it.ability));
  }, [search, localChar, pinyinMap]);

  /* ===============================
     Section B — insert search
  =============================== */
  const insertResults = useMemo(() => {
    const q = insertSearch.trim().toLowerCase();
    if (!q) return [];
    return pinyinFilter(ALL_ABILITIES, {}, q);
  }, [insertSearch]);

  /* ===============================
     Refresh
  =============================== */
  const refreshCharacter = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/characters/${char._id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLocalChar(data);
      onUpdated(data);
    } catch {
      toastError("刷新失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  const runWithRefresh = async (action: () => Promise<void>) => {
    try {
      await action();
      await refreshCharacter();
    } catch {
      toastError("操作失败，请稍后再试");
    }
  };

  /* ===============================
     Insert book
  =============================== */
  const addLevel10Book = async (ability: string) => {
    await runWithRefresh(async () => {
      await fetch(`${API_URL}/api/characters/${char._id}/storage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ability, level: 10 }),
      });
    });
  };

  /* ===============================
     Use / Delete
  =============================== */
  const getUseButtonState = (
    item: StorageItem,
    currentLevel: number
  ): { text: string; className: string; disabled?: boolean } => {
    if (currentLevel >= 10)
      return { text: "已十", className: "deleteBtn", disabled: true };

    if (item.level === 9 && currentLevel < 8)
      return { text: "未八", className: "yellowBtn" };

    if (item.level === 10 && currentLevel < 9)
      return { text: "未九", className: "yellowBtn" };

    if (
      item.level === 9 &&
      localChar.storage?.some(
        (s) => s.ability === item.ability && s.level === 10
      )
    )
      return { text: "有十", className: "yellowBtn" };

    return { text: "使用", className: "useBtn" };
  };

  const requestUse = (item: StorageItem) => {
    setConfirmTitle("确认使用");
    setConfirmMessage(
      `确定要使用 ${item.ability} · ${numToChinese(item.level)}重 吗？`
    );
    setOnConfirmAction(() => async () => {
      setConfirmOpen(false);
      await runWithRefresh(async () => {
        await fetch(`${API_URL}/api/characters/${char._id}/storage/use`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ability: item.ability, level: item.level }),
        });
      });
    });
    setConfirmOpen(true);
  };

  const requestDelete = (item: StorageItem) => {
    setConfirmTitle("确认删除");
    setConfirmMessage(
      `确定要删除 ${item.ability} · ${numToChinese(item.level)}重 吗？`
    );
    setOnConfirmAction(() => async () => {
      setConfirmOpen(false);
      await runWithRefresh(async () => {
        await fetch(`${API_URL}/api/characters/${char._id}/storage/delete`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ability: item.ability, level: item.level }),
        });
      });
    });
    setConfirmOpen(true);
  };

  return {
    /* Section A */
    search,
    setSearch,
    filteredItems,

    /* Section B */
    insertSearch,
    setInsertSearch,
    insertResults,
    addLevel10Book,

    /* Shared */
    localChar,
    loading,
    confirmOpen,
    confirmTitle,
    confirmMessage,
    onConfirmAction,
    setConfirmOpen,
    getUseButtonState,
    requestUse,
    requestDelete,
  };
}
