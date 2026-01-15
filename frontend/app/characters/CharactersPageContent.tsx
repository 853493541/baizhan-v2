"use client";

import { useEffect, useState } from "react";
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

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();

  /* -------------------- 🔹 Filter State -------------------- */
  const [ownerFilter, setOwnerFilter] = useState("");
  const [serverFilter, setServerFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedAbilities, setSelectedAbilities] = useState<string[]>([]);
  const [globalLevel, setGlobalLevel] = useState<number | null>(null);
  const [activeOnly, setActiveOnly] = useState(true);

  const [restored, setRestored] = useState(false);

  const abilityFilters =
    globalLevel != null
      ? selectedAbilities.map((a) => ({ ability: a, level: globalLevel }))
      : [];

  /* -------------------- 🔹 Session Restore -------------------- */
  useEffect(() => {
    const saved = sessionStorage.getItem("characterFilters");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setOwnerFilter(parsed.ownerFilter || "");
        setServerFilter(parsed.serverFilter || "");
        setRoleFilter(parsed.roleFilter || "");
        setSelectedAbilities(parsed.selectedAbilities || []);
        setGlobalLevel(parsed.globalLevel ?? null);
        setActiveOnly(
          typeof parsed.activeOnly === "boolean" ? parsed.activeOnly : true
        );
      } catch {}
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    sessionStorage.setItem(
      "characterFilters",
      JSON.stringify({
        ownerFilter,
        serverFilter,
        roleFilter,
        selectedAbilities,
        globalLevel,
        activeOnly,
      })
    );
  }, [
    restored,
    ownerFilter,
    serverFilter,
    roleFilter,
    selectedAbilities,
    globalLevel,
    activeOnly,
  ]);

  /* -------------------- 🔹 Backend Filter Fetch -------------------- */
  const fetchFilteredCharacters = async (isInitial = false) => {
    try {
      if (isInitial) setInitialLoading(true);
      else setFiltering(true);

      const res = await fetch(
        `${API_URL}/api/characters/page/filter`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ abilityFilters }),
        }
      );

      if (!res.ok) throw new Error("加载失败");

      const data = await res.json();
      setCharacters(data);
    } catch (err) {
      console.error(err);
      setError("角色加载失败");
    } finally {
      setInitialLoading(false);
      setFiltering(false);
    }
  };

  /* Initial load */
  useEffect(() => {
    fetchFilteredCharacters(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Ability filter change */
  useEffect(() => {
    if (!restored) return;
    fetchFilteredCharacters(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(abilityFilters)]);

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

  /* -------------------- 🔹 Frontend Basic Filters -------------------- */
  const filteredCharacters = characters.filter((c) => {
    if (ownerFilter && c.owner !== ownerFilter) return false;
    if (serverFilter && c.server !== serverFilter) return false;
    if (roleFilter && c.role !== roleFilter) return false;
    if (activeOnly && !c.active) return false;
    if (!activeOnly && c.active) return false;
    return true;
  });

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
        ownerFilter={ownerFilter}
        serverFilter={serverFilter}
        roleFilter={roleFilter}
        activeOnly={activeOnly}
        uniqueOwners={[...new Set(characters.map((c) => c.owner))]}
        uniqueServers={[...new Set(characters.map((c) => c.server))]}
        abilityFilters={abilityFilters}
        selectedAbilities={selectedAbilities}
        globalLevel={globalLevel}
        setOwnerFilter={setOwnerFilter}
        setServerFilter={setServerFilter}
        setRoleFilter={setRoleFilter}
        setActiveOnly={setActiveOnly}
        onAddAbility={(a, l) => {
          setSelectedAbilities((p) =>
            p.includes(a) ? p.filter((x) => x !== a) : [...p, a]
          );
          setGlobalLevel(l);
        }}
        onRemoveAbility={(i) =>
          setSelectedAbilities((p) => p.filter((_, idx) => idx !== i))
        }
        setAbilityFilters={() => {}}
        setSelectedAbilities={setSelectedAbilities}
        onChangeGlobalLevel={setGlobalLevel}
      />

      {/* Optional subtle loading indicator */}
      {/* {filtering && <div className={styles.subtleLoading}>筛选中…</div>} */}

      <CharacterGrid
        characters={filteredCharacters}
        onUpdated={() => fetchFilteredCharacters(false)}
      />
    </div>
  );
}
