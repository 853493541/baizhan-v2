"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import styles from "./styles.module.css";
import FilterSection from "./Filter";
import CharacterCard from "../characters/components/CreateCharacterModal/CharacterCard";
import { createPinyinMap, pinyinFilter } from "@/utils/pinyinSearch";

interface StorageItem {
  ability: string;
  level: number;
  sourceBoss?: string;
  receivedAt?: string;
  used?: boolean;
}

interface Character {
  _id: string;
  name: string;
  owner: string;
  server: string;
  role: string;
  class: string;
  active?: boolean; // ✅ NEW (only addition)
  abilities?: Record<string, number>;
  storage?: StorageItem[];
}

const CORE_ABILITIES = [
  "斗转金移",
  "花钱消灾",
  "黑煞落贪狼",
  "一闪天诛",
  "引燃",
  "漾剑式",
  "阴阳术退散",
  "兔死狐悲",
  "火焰之种",
  "阴雷之种",
  "飞云回转刀",
  "三个铜钱",
  "乾坤一掷",
  "尸鬼封烬",
  "厄毒爆发",
];

export default function BackpackPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pinyinMap, setPinyinMap] = useState<
    Record<string, { full: string; short: string }>
  >({});
  const [pinyinReady, setPinyinReady] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  /* ----------------------------------------------------------------------
     🧭 Load saved filters from localStorage (except name)
  ---------------------------------------------------------------------- */
  const getSavedFilters = () => {
    try {
      const saved = localStorage.getItem("backpackFilters");
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      delete parsed.name;
      return parsed;
    } catch {
      return {};
    }
  };

  const saved = typeof window !== "undefined" ? getSavedFilters() : {};

  const [ownerFilter, setOwnerFilter] = useState(saved.owner || "");
  const [serverFilter, setServerFilter] = useState(saved.server || "");
  const [roleFilter, setRoleFilter] = useState(saved.role || "");
  const [onlyWithStorage, setOnlyWithStorage] = useState(
    saved.onlyWithStorage ?? true
  );
  const [showCoreOnly, setShowCoreOnly] = useState(saved.showCoreOnly ?? false);
  const [nameFilter, setNameFilter] = useState("");

  /* ----------------------------------------------------------------------
     🧩 Fetch all characters
  ---------------------------------------------------------------------- */
  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/characters`);
        if (!res.ok) throw new Error("无法加载角色数据");
        const data = await res.json();
        setCharacters(data);
      } catch (err) {
        console.error("❌ fetchAll error:", err);
        setError("无法加载角色信息");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [API_URL]);

  /* ----------------------------------------------------------------------
     ⚡ Lazy-load pinyin only when user clicks the search box
  ---------------------------------------------------------------------- */
  const handleSearchFocus = useCallback(async () => {
    if (pinyinReady || characters.length === 0) return;
    try {
      const names = characters.map((c) => c.name);
      const map = await createPinyinMap(names);
      setPinyinMap(map);
      setPinyinReady(true);
      console.log("✅ Pinyin map loaded on user interaction");
    } catch (err) {
      console.error("❌ pinyin map error:", err);
    }
  }, [pinyinReady, characters]);

  /* ----------------------------------------------------------------------
     🔍 Unique filter options
  ---------------------------------------------------------------------- */
  const uniqueOwners = useMemo(
    () => Array.from(new Set(characters.map((c) => c.owner).filter(Boolean))),
    [characters]
  );

  const uniqueServers = useMemo(
    () => Array.from(new Set(characters.map((c) => c.server).filter(Boolean))),
    [characters]
  );

  /* ----------------------------------------------------------------------
     🧩 Apply filters
  ---------------------------------------------------------------------- */
  const filtered = useMemo(() => {
    // ✅ FILTER OUT INACTIVE CHARACTERS HERE (correct place)
    let list = characters.filter((c) => c.active !== false);

    if (ownerFilter) list = list.filter((char) => char.owner === ownerFilter);
    if (serverFilter) list = list.filter((char) => char.server === serverFilter);
    if (roleFilter) list = list.filter((char) => char.role === roleFilter);
    if (onlyWithStorage)
      list = list.filter((char) => char.storage && char.storage.length > 0);
    if (showCoreOnly)
      list = list.filter((char) =>
        (char.storage || []).some((item) =>
          CORE_ABILITIES.includes(item.ability)
        )
      );

    if (nameFilter.trim() && Object.keys(pinyinMap).length > 0) {
      const allNames = list.map((c) => c.name);
      const matchedNames = pinyinFilter(
        allNames,
        pinyinMap,
        nameFilter.trim()
      );
      list = list.filter((c) => matchedNames.includes(c.name));
    }

    return list;
  }, [
    characters,
    ownerFilter,
    serverFilter,
    roleFilter,
    onlyWithStorage,
    showCoreOnly,
    nameFilter,
    pinyinMap,
  ]);

  /* ----------------------------------------------------------------------
     💾 Persist filters (except name)
  ---------------------------------------------------------------------- */
  useEffect(() => {
    localStorage.setItem(
      "backpackFilters",
      JSON.stringify({
        owner: ownerFilter,
        server: serverFilter,
        role: roleFilter,
        onlyWithStorage,
        showCoreOnly,
      })
    );
  }, [
    ownerFilter,
    serverFilter,
    roleFilter,
    onlyWithStorage,
    showCoreOnly,
  ]);

  /* ----------------------------------------------------------------------
     🔧 Local character update
  ---------------------------------------------------------------------- */
  const handleCharacterUpdate = (updated: Character) => {
    setCharacters((prev) =>
      prev.map((c) => (c._id === updated._id ? updated : c))
    );
  };

  /* ----------------------------------------------------------------------
     🧱 Render
  ---------------------------------------------------------------------- */
  if (loading) return <p>加载中...</p>;
  if (error && !characters.length) return <p>{error}</p>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>全角色背包</h1>

      <FilterSection
        ownerFilter={ownerFilter}
        serverFilter={serverFilter}
        roleFilter={roleFilter}
        onlyWithStorage={onlyWithStorage}
        showCoreOnly={showCoreOnly}
        nameFilter={nameFilter}
        uniqueOwners={uniqueOwners}
        uniqueServers={uniqueServers}
        setOwnerFilter={setOwnerFilter}
        setServerFilter={setServerFilter}
        setRoleFilter={setRoleFilter}
        setOnlyWithStorage={setOnlyWithStorage}
        setShowCoreOnly={setShowCoreOnly}
        setNameFilter={setNameFilter}
        onSearchFocus={handleSearchFocus}
      />

      <div className={styles.grid}>
        {filtered.map((char) => (
          <CharacterCard
            key={char._id}
            char={char}
            API_URL={API_URL || ""}
            showCoreOnly={showCoreOnly}
            onCharacterUpdate={handleCharacterUpdate}
          />
        ))}
      </div>
    </div>
  );
}
