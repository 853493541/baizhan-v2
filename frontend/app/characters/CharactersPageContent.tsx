"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // ✅ import router

import CreateCharacterModal from "@/app/components/characters/CreateCharacterModal";
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
  const router = useRouter(); // ✅ initialize router

  // ===== Filter state =====
  const [ownerFilter, setOwnerFilter] = useState("");
  const [serverFilter, setServerFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedAbilities, setSelectedAbilities] = useState<string[]>([]);
  const [globalLevel, setGlobalLevel] = useState<number | null>(null);

  const [restored, setRestored] = useState(false); // ✅ safeguard flag

  const abilityFilters: { ability: string; level: number }[] =
    globalLevel != null
      ? selectedAbilities.map((a) => ({ ability: a, level: globalLevel }))
      : [];

  // ===== Restore filters from localStorage =====
  useEffect(() => {
    const saved = localStorage.getItem("characterFilters");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        setOwnerFilter(parsed.ownerFilter || "");
        setServerFilter(parsed.serverFilter || "");
        setRoleFilter(parsed.roleFilter || "");
        setSelectedAbilities(parsed.selectedAbilities || []);
        setGlobalLevel(parsed.globalLevel ?? null);
      } catch (err) {
        console.error("❌ Failed to parse saved filters", err);
      }
    }
    setRestored(true); // ✅ mark restore complete
  }, []);

  // ===== Save filters to localStorage whenever they change =====
  useEffect(() => {
    if (!restored) return;

    const state = {
      ownerFilter,
      serverFilter,
      roleFilter,
      selectedAbilities,
      globalLevel,
    };
    localStorage.setItem("characterFilters", JSON.stringify(state));
  }, [restored, ownerFilter, serverFilter, roleFilter, selectedAbilities, globalLevel]);

  // ===== Handlers =====
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

  // ===== Fetch characters =====
  const refreshCharacters = () => {
    fetch(`${API_URL}/api/characters`)
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

  // ===== Create handler =====
  const handleCreate = async (data: any) => {
    try {
      const res = await fetch(`${API_URL}/api/characters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("创建失败");

      const newChar = await res.json();

      // ✅ update list
      setCharacters((prev) => [...prev, newChar]);

      // ✅ jump to detail page
      router.push(`/characters/${newChar._id}`);
    } catch (err) {
      console.error("❌ Error creating character:", err);
      setError("角色创建失败");
    }
  };

  // ===== Derived values =====
  const uniqueOwners = Array.from(
    new Set(characters.map((c) => c.owner || "Unknown"))
  ).sort();
  const uniqueServers = Array.from(
    new Set(characters.map((c) => c.server))
  ).sort();

  const filteredCharacters = characters.filter((c) => {
    if (ownerFilter && c.owner !== ownerFilter) return false;
    if (serverFilter && c.server !== serverFilter) return false;
    if (roleFilter && c.role !== roleFilter) return false;

    for (const f of abilityFilters) {
      const level = c.abilities?.[f.ability] || 0;
      if (level !== f.level) return false;
    }
    return true;
  });

  if (loading) return <p className={styles.message}>角色加载中...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container}>
      {/* Header row with text left + button right */}
      <div className={styles.headerRow}>
        <span className={styles.headerText}>角色仓库</span>
        <CreateButton onClick={() => setModalOpen(true)} />
      </div>

      {isModalOpen && (
        <CreateCharacterModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          onCreate={handleCreate}
        />
      )}

      <CharacterFilters
        ownerFilter={ownerFilter}
        serverFilter={serverFilter}
        roleFilter={roleFilter}
        uniqueOwners={uniqueOwners}
        uniqueServers={uniqueServers}
        abilityFilters={abilityFilters}
        selectedAbilities={selectedAbilities}
        globalLevel={globalLevel}
        setOwnerFilter={setOwnerFilter}
        setServerFilter={setServerFilter}
        setRoleFilter={setRoleFilter}
        onAddAbility={handleAddAbilityFilter}
        onRemoveAbility={handleRemoveAbilityFilter}
        setAbilityFilters={() => {}} // no-op, derived locally
        setSelectedAbilities={setSelectedAbilities}
        onChangeGlobalLevel={setGlobalLevel}
      />

      <CharacterGrid characters={filteredCharacters} onUpdated={refreshCharacters} />
    </div>
  );
}
