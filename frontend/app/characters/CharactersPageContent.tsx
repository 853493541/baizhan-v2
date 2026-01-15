"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import CreateCharacterModal from "@/app/characters/components/CreateCharacterModal";
import { Character } from "@/types/Character";
import { normalizeGender } from "@/utils/normalize";
import styles from "./page.module.css";

import CharacterFilters from "./sections/CharacterFilters";
import CharacterGrid from "./sections/CharacterGrid";
import CreateButton from "./sections/CreateButton";

export default function CharactersPageContent() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [activeOnly, setActiveOnly] = useState(true); // ✅ default: show active tab

  const [restored, setRestored] = useState(false);

  const abilityFilters: { ability: string; level: number }[] =
    globalLevel != null
      ? selectedAbilities.map((a) => ({ ability: a, level: globalLevel }))
      : [];

  /* -------------------- 🔹 Per-Tab Session Check -------------------- */
  useEffect(() => {
    const hasSession = sessionStorage.getItem("session_id");
    if (!hasSession) {
      // 🧹 true new tab — clear any restored session data
      sessionStorage.clear();
      sessionStorage.setItem("session_id", Date.now().toString());
    }
  }, []);

  /* -------------------- 🔹 Restore Filters -------------------- */
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
        setActiveOnly(typeof parsed.activeOnly === "boolean" ? parsed.activeOnly : true);
      } catch (err) {
        console.error("❌ Failed to parse saved filters", err);
      }
    }
    setRestored(true);
  }, []);

  /* -------------------- 🔹 Save Filters -------------------- */
  useEffect(() => {
    if (!restored) return;
    const state = {
      ownerFilter,
      serverFilter,
      roleFilter,
      selectedAbilities,
      globalLevel,
      activeOnly,
    };
    sessionStorage.setItem("characterFilters", JSON.stringify(state));
  }, [
    restored,
    ownerFilter,
    serverFilter,
    roleFilter,
    selectedAbilities,
    globalLevel,
    activeOnly,
  ]);

  /* -------------------- 🔹 Handlers -------------------- */
  const handleAddAbilityFilter = (ability: string, level: number) => {
    const exists = selectedAbilities.includes(ability);
    const next = exists
      ? selectedAbilities.filter((a) => a !== ability)
      : [...selectedAbilities, ability];
    setSelectedAbilities(next);
    if (level != null) setGlobalLevel(level);
  };

  const handleRemoveAbilityFilter = (index: number) => {
    const next = selectedAbilities.filter((_, i) => i !== index);
    setSelectedAbilities(next);
  };

  /* -------------------- 🔹 Fetch Characters -------------------- */
  const refreshCharacters = () => {
    fetch(`${API_URL}/api/characters/page`)
      .then((res) => res.json())
      .then((data) => {
        const normalized: Character[] = data.map((c: any) => ({
          ...c,
          gender: normalizeGender(c.gender),
        }));
        setCharacters(normalized);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[CharactersPageContent] fetch error", err);
        setError("角色加载失败");
        setLoading(false);
      });
  };

  useEffect(() => {
    refreshCharacters();
  }, []);

  /* -------------------- 🔹 Create Character -------------------- */
  const handleCreate = async (data: any) => {
    try {
      const res = await fetch(`${API_URL}/api/characters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("创建失败");

      const newChar = await res.json();
      setCharacters((prev) => [...prev, newChar]);
      router.push(`/characters/${newChar._id}`);
    } catch (err) {
      console.error("❌ Error creating character:", err);
      setError("角色创建失败");
    }
  };

  /* -------------------- 🔹 Derived Values -------------------- */
  const uniqueOwners = Array.from(
    new Set(characters.map((c) => c.owner || "Unknown"))
  ).sort();
  const uniqueServers = Array.from(
    new Set(characters.map((c) => c.server))
  ).sort();

  /* -------------------- 🔹 Apply Filters -------------------- */
  const filteredCharacters = characters.filter((c) => {
    if (ownerFilter && c.owner !== ownerFilter) return false;
    if (serverFilter && c.server !== serverFilter) return false;
    if (roleFilter && c.role !== roleFilter) return false;

    // 🟢 Activation tab logic — only show one group at a time
    if (activeOnly && !c.active) return false; // showing only active
    if (!activeOnly && c.active) return false; // showing only inactive

    for (const f of abilityFilters) {
      const level = c.abilities?.[f.ability] || 0;
      if (level !== f.level) return false;
    }

    return true;
  });

  /* -------------------- 🔹 UI -------------------- */
  if (loading) return <p className={styles.message}>角色加载中...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerRow}>
        <span className={styles.headerText}>角色仓库</span>
        <CreateButton onClick={() => setModalOpen(true)} />
      </div>

      {/* Modal */}
      {isModalOpen && (
        <CreateCharacterModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          onCreate={handleCreate}
        />
      )}

      {/* Filters */}
      <CharacterFilters
        ownerFilter={ownerFilter}
        serverFilter={serverFilter}
        roleFilter={roleFilter}
        activeOnly={activeOnly}
        uniqueOwners={uniqueOwners}
        uniqueServers={uniqueServers}
        abilityFilters={abilityFilters}
        selectedAbilities={selectedAbilities}
        globalLevel={globalLevel}
        setOwnerFilter={setOwnerFilter}
        setServerFilter={setServerFilter}
        setRoleFilter={setRoleFilter}
        setActiveOnly={setActiveOnly}
        onAddAbility={handleAddAbilityFilter}
        onRemoveAbility={handleRemoveAbilityFilter}
        setAbilityFilters={() => {}}
        setSelectedAbilities={setSelectedAbilities}
        onChangeGlobalLevel={setGlobalLevel}
      />

      {/* Grid */}
      <CharacterGrid
        characters={filteredCharacters}
        onUpdated={refreshCharacters}
      />
    </div>
  );
}
