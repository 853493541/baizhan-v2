"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./styles.module.css";
import FilterSection from "./Filter";
import CharacterCard from "./CharacterCard";
import { createPinyinMap, pinyinFilter } from "../../utils/pinyinSearch"; // ✅ use helper

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
  abilities?: Record<string, number>;
  storage?: StorageItem[];
}

// ✅ Core abilities
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
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // ===== Initialize filters =====
  const getSavedFilters = () => {
    try {
      const saved = localStorage.getItem("backpackFilters");
      return saved ? JSON.parse(saved) : {};
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
  const [nameFilter, setNameFilter] = useState(saved.name || ""); // ✅ NEW

  // 🧭 Fetch all characters once
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

  // 🔍 Unique lists
  const uniqueOwners = useMemo(
    () => Array.from(new Set(characters.map((c) => c.owner).filter(Boolean))),
    [characters]
  );

  const uniqueServers = useMemo(
    () => Array.from(new Set(characters.map((c) => c.server).filter(Boolean))),
    [characters]
  );

  // 🧩 Precompute pinyin map once
  const pinyinMap = useMemo(() => {
    const names = characters.map((c) => c.name);
    return createPinyinMap(names);
  }, [characters]);

  // 🧩 Apply filters
  const filtered = useMemo(() => {
    let list = characters;

    if (ownerFilter)
      list = list.filter((char) => char.owner === ownerFilter);
    if (serverFilter)
      list = list.filter((char) => char.server === serverFilter);
    if (roleFilter)
      list = list.filter((char) => char.role === roleFilter);
    if (onlyWithStorage)
      list = list.filter((char) => char.storage && char.storage.length > 0);
    if (showCoreOnly)
      list = list.filter((char) =>
        (char.storage || []).some((item) =>
          CORE_ABILITIES.includes(item.ability)
        )
      );

    // ✅ Name search (supports Chinese, full pinyin, and initials)
    if (nameFilter.trim()) {
      const allNames = list.map((c) => c.name);
      const matchedNames = pinyinFilter(allNames, pinyinMap, nameFilter.trim());
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

  // ✅ Persist filters
  useEffect(() => {
    localStorage.setItem(
      "backpackFilters",
      JSON.stringify({
        owner: ownerFilter,
        server: serverFilter,
        role: roleFilter,
        onlyWithStorage,
        showCoreOnly,
        name: nameFilter,
      })
    );
  }, [
    ownerFilter,
    serverFilter,
    roleFilter,
    onlyWithStorage,
    showCoreOnly,
    nameFilter,
  ]);

  // ✅ Local patch update
  const handleCharacterUpdate = (updated: Character) => {
    setCharacters((prev) =>
      prev.map((c) => (c._id === updated._id ? updated : c))
    );
  };

  // ===== Render =====
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
        nameFilter={nameFilter} // ✅ pass down
        uniqueOwners={uniqueOwners}
        uniqueServers={uniqueServers}
        setOwnerFilter={setOwnerFilter}
        setServerFilter={setServerFilter}
        setRoleFilter={setRoleFilter}
        setOnlyWithStorage={setOnlyWithStorage}
        setShowCoreOnly={setShowCoreOnly}
        setNameFilter={setNameFilter} // ✅ pass setter
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
