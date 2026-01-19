"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import CreateCharacterModal from "@/app/characters/components/CreateCharacterModal";
import { Character } from "@/types/Character";
import styles from "./page.module.css";

import CharacterFilters from "./sections/CharacterFilters";
import CharacterGrid from "./sections/CharacterGrid";
import CreateButton from "./sections/CreateButton";

export default function CharactersPageContent() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);

  // ✅ TRUE metadata cache (UNFILTERED, COMPLETE)
  const [allOwners, setAllOwners] = useState<string[]>([]);
  const [allServers, setAllServers] = useState<string[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();

  /* -------------------- 🔹 Filter State -------------------- */
  const [nameFilter, setNameFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [serverFilter, setServerFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedAbilities, setSelectedAbilities] = useState<string[]>([]);
  const [globalLevel, setGlobalLevel] = useState<number | null>(null);
  const [activeOnly, setActiveOnly] = useState(true);
  const [tradableOnly, setTradableOnly] = useState(false);

  // 🔐 restore gate
  const [restored, setRestored] = useState(false);

  const abilityFilters =
    globalLevel != null
      ? selectedAbilities.map((a) => ({ ability: a, level: globalLevel }))
      : [];

  /* -------------------- 🔹 Session Restore (FIRST) -------------------- */
  useEffect(() => {
    const saved = sessionStorage.getItem("characterFilters");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNameFilter(parsed.nameFilter || "");
        setOwnerFilter(parsed.ownerFilter || "");
        setServerFilter(parsed.serverFilter || "");
        setRoleFilter(parsed.roleFilter || "");
        setSelectedAbilities(parsed.selectedAbilities || []);
        setGlobalLevel(parsed.globalLevel ?? null);
        setActiveOnly(
          typeof parsed.activeOnly === "boolean" ? parsed.activeOnly : true
        );
        setTradableOnly(
          typeof parsed.tradableOnly === "boolean"
            ? parsed.tradableOnly
            : false
        );
      } catch {
        // ignore corrupted cache
      }
    }
    setRestored(true);
  }, []);

  /* -------------------- 🔹 Persist Session (AFTER restore) -------------------- */
  useEffect(() => {
    if (!restored) return;
    sessionStorage.setItem(
      "characterFilters",
      JSON.stringify({
        nameFilter,
        ownerFilter,
        serverFilter,
        roleFilter,
        selectedAbilities,
        globalLevel,
        activeOnly,
        tradableOnly,
      })
    );
  }, [
    restored,
    nameFilter,
    ownerFilter,
    serverFilter,
    roleFilter,
    selectedAbilities,
    globalLevel,
    activeOnly,
    tradableOnly,
  ]);

  /* -------------------- 🔹 LOAD FILTER METADATA (UNFILTERED, ONCE) -------------------- */
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/characters/page/filter`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}), // ✅ ALWAYS unfiltered
          }
        );

        if (!res.ok) throw new Error("meta load failed");

        const data: Character[] = await res.json();

        setAllOwners([...new Set(data.map((c) => c.owner))]);
        setAllServers([...new Set(data.map((c) => c.server))]);
      } catch (err) {
        console.error("Failed to load filter metadata", err);
      }
    };

    fetchMeta();
  }, [API_URL]);

  /* -------------------- 🔹 Backend Filter Fetch (GRID ONLY) -------------------- */
  const fetchFilteredCharacters = useCallback(async () => {
    if (!restored) return;

    try {
      setFiltering(true);

      const res = await fetch(
        `${API_URL}/api/characters/page/filter`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nameFilter || undefined,
            owner: ownerFilter || undefined,
            server: serverFilter || undefined,
            role: roleFilter || undefined,
            active: activeOnly, // ✅ always boolean
            tradable: tradableOnly ? true : undefined,
            abilityFilters,
          }),
        }
      );

      if (!res.ok) throw new Error("加载失败");

      const data: Character[] = await res.json();
      setCharacters(data);
    } catch (err) {
      console.error(err);
      setError("角色加载失败");
    } finally {
      setFiltering(false);
      setInitialLoading(false);
    }
  }, [
    restored,
    API_URL,
    nameFilter,
    ownerFilter,
    serverFilter,
    roleFilter,
    activeOnly,
    tradableOnly,
    JSON.stringify(abilityFilters),
  ]);

  /* -------------------- 🔹 React to filter changes (AND first load) -------------------- */
  useEffect(() => {
    if (!restored) return;
    fetchFilteredCharacters();
  }, [
    restored,
    nameFilter,
    ownerFilter,
    serverFilter,
    roleFilter,
    activeOnly,
    tradableOnly,
    JSON.stringify(abilityFilters),
    fetchFilteredCharacters,
  ]);

  /* -------------------- 🔹 Create Character -------------------- */
  const handleCreate = async (data: any) => {
    const res = await fetch(`${API_URL}/api/characters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const newChar = await res.json();
    router.push(`/characters/${newChar._id}`);
  };

  /* -------------------- 🔹 UI -------------------- */
  if (initialLoading) {
    return <p className={styles.message}>角色加载中...</p>;
  }

  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <span className={styles.headerText}>角色仓库</span>
        <CreateButton onClick={() => setModalOpen(true)} />
      </div>

      {isModalOpen && (
        <CreateCharacterModal
          isOpen
          onClose={() => setModalOpen(false)}
          onCreate={handleCreate}
        />
      )}

      <CharacterFilters
        nameFilter={nameFilter}
        setNameFilter={setNameFilter}
        ownerFilter={ownerFilter}
        serverFilter={serverFilter}
        roleFilter={roleFilter}
        activeOnly={activeOnly}
        tradableOnly={tradableOnly}
        uniqueOwners={allOwners}   // ✅ COMPLETE, UNFILTERED
        uniqueServers={allServers} // ✅ COMPLETE, UNFILTERED
        selectedAbilities={selectedAbilities}
        globalLevel={globalLevel}
        setOwnerFilter={setOwnerFilter}
        setServerFilter={setServerFilter}
        setRoleFilter={setRoleFilter}
        setActiveOnly={setActiveOnly}
        setTradableOnly={setTradableOnly}
        onAddAbility={(a, l) => {
          setSelectedAbilities((p) =>
            p.includes(a) ? p.filter((x) => x !== a) : [...p, a]
          );
          setGlobalLevel(l);
        }}
        onRemoveAbility={(i) =>
          setSelectedAbilities((p) => p.filter((_, idx) => idx !== i))
        }
        setSelectedAbilities={setSelectedAbilities}
        onChangeGlobalLevel={setGlobalLevel}
      />

      <CharacterGrid
        characters={characters}
        onUpdated={fetchFilteredCharacters}
      />
    </div>
  );
}
