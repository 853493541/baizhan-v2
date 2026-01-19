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
   Insert ability pool (STATIC)
=============================== */
const ALL_ABILITIES: string[] = Array.from(
  new Set(Object.values(bossData).flat() as string[])
);

/* ===============================
   Hook
=============================== */
export function useManagerLogic(
  char: Character | null,
  API_URL: string,
  onUpdated: (c: Character) => void
) {
  /* ===============================
     Normalize character
  =============================== */
  const safeChar: Character = char ?? {
    _id: "",
    abilities: {},
    storage: [],
  };

  const [localChar, setLocalChar] = useState<Character>(safeChar);

  useEffect(() => {
    if (char) setLocalChar(char);
  }, [char]);

  /* ===============================
     Search states
  =============================== */
  const [search, setSearch] = useState("");
  const [insertSearch, setInsertSearch] = useState("");

  const [loading, setLoading] = useState(false);

  /* ===============================
     Confirm modal
  =============================== */
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] =
    useState<(() => void) | null>(null);

  /* ===============================
     Pinyin maps
  =============================== */
  const [storagePinyinMap, setStoragePinyinMap] = useState<
    Record<string, { full: string; short: string }>
  >({});

  const [insertPinyinMap, setInsertPinyinMap] = useState<
    Record<string, { full: string; short: string }>
  >({});

  /* ===============================
     Build storage pinyin map
  =============================== */
  useEffect(() => {
    async function build() {
      const names = localChar.storage?.map((s) => s.ability) ?? [];
      if (!names.length) return;
      setStoragePinyinMap(await createPinyinMap(names));
    }
    build();
  }, [localChar.storage]);

  /* ===============================
     Build insert pinyin map (ONCE)
  =============================== */
  useEffect(() => {
    async function build() {
      setInsertPinyinMap(await createPinyinMap(ALL_ABILITIES));
    }
    build();
  }, []);

  /* ===============================
     Section A — Backpack filter
  =============================== */
  const filteredItems = useMemo(() => {
    const list = localChar.storage ?? [];
    const q = search.trim().toLowerCase();

    if (!q) return list;

    const names = list.map((i) => i.ability);
    const matched = pinyinFilter(names, storagePinyinMap, q);
    return list.filter((i) => matched.includes(i.ability));
  }, [search, localChar.storage, storagePinyinMap]);

  /* ===============================
     Section B — Insert filter (FIXED)
     RULE:
     - no search → return ALL (preview handled by UI)
     - has search → pinyin filter
  =============================== */
  const insertResults = useMemo(() => {
    const q = insertSearch.trim().toLowerCase();

    if (!q) return ALL_ABILITIES;

    return pinyinFilter(ALL_ABILITIES, insertPinyinMap, q);
  }, [insertSearch, insertPinyinMap]);

  /* ===============================
     UX helpers
  =============================== */
  const hasStorageSearch = search.trim().length > 0;
  const hasInsertSearch = insertSearch.trim().length > 0;

  /* ===============================
     Refresh character
  =============================== */
  const refreshCharacter = async () => {
    if (!safeChar._id) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/characters/${safeChar._id}`);
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
    if (!safeChar._id) return;

    await runWithRefresh(async () => {
      await fetch(`${API_URL}/api/characters/${safeChar._id}/storage`, {
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
    if (!safeChar._id) return;

    setConfirmTitle("确认使用");
    setConfirmMessage(
      `确定要使用 ${item.ability} · ${numToChinese(item.level)}重 吗？`
    );
    setOnConfirmAction(() => async () => {
      setConfirmOpen(false);
      await runWithRefresh(async () => {
        await fetch(`${API_URL}/api/characters/${safeChar._id}/storage/use`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ability: item.ability, level: item.level }),
        });
      });
    });
    setConfirmOpen(true);
  };

  const requestDelete = (item: StorageItem) => {
    if (!safeChar._id) return;

    setConfirmTitle("确认删除");
    setConfirmMessage(
      `确定要删除 ${item.ability} · ${numToChinese(item.level)}重 吗？`
    );
    setOnConfirmAction(() => async () => {
      setConfirmOpen(false);
      await runWithRefresh(async () => {
        await fetch(`${API_URL}/api/characters/${safeChar._id}/storage/delete`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ability: item.ability, level: item.level }),
        });
      });
    });
    setConfirmOpen(true);
  };

  return {
    /* Backpack */
    search,
    setSearch,
    filteredItems,
    hasStorageSearch,

    /* Insert */
    insertSearch,
    setInsertSearch,
    insertResults,
    hasInsertSearch,
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
