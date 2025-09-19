"use client";

import { useEffect, useState } from "react";
import CreateCharacterModal from "@/app/components/characters/CreateCharacterModal";
import { Character } from "@/types/Character";
import { normalizeGender } from "@/utils/normalize";
import styles from "./page.module.css";

import TitleBar from "@/app/components/layout/titleBar";  // ✅ new import
import CharacterFilters from "./sections/CharacterFilters";
import CharacterGrid from "./sections/CharacterGrid";
import CreateButton from "./sections/CreateButton";

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setModalOpen] = useState(false);

  const [ownerFilter, setOwnerFilter] = useState("");
  const [serverFilter, setServerFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [abilityFilters, setAbilityFilters] = useState<
    { ability: string; level: number }[]
  >([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
        console.error(err);
        setError("角色加载失败");
        setLoading(false);
      });
  };

  useEffect(() => {
    refreshCharacters();
  }, []);

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
    } catch (err) {
      console.error("❌ Error creating character:", err);
      setError("角色创建失败");
    }
  };

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

  const handleAddAbilityFilter = (ability: string, level: number) => {
    const currentAbilities = abilityFilters.map((f) => f.ability);
    let newAbilities: string[];

    if (currentAbilities.includes(ability)) {
      newAbilities = currentAbilities.filter((a) => a !== ability);
    } else {
      newAbilities = [...currentAbilities, ability];
    }

    setAbilityFilters(newAbilities.map((a) => ({ ability: a, level })));
  };

  const handleRemoveAbilityFilter = (index: number) => {
    const newFilters = [...abilityFilters];
    newFilters.splice(index, 1);
    setAbilityFilters(newFilters);
  };

  if (loading) return <p className={styles.message}>角色加载中...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container}>
      {/* ✅ Replaced plain <h1> with TitleBar */}
      <TitleBar
        title="角色仓库"
        
      />

      <CharacterFilters
        ownerFilter={ownerFilter}
        serverFilter={serverFilter}
        roleFilter={roleFilter}
        uniqueOwners={uniqueOwners}
        uniqueServers={uniqueServers}
        abilityFilters={abilityFilters}
        setOwnerFilter={setOwnerFilter}
        setServerFilter={setServerFilter}
        setRoleFilter={setRoleFilter}
        onAddAbility={handleAddAbilityFilter}
        onRemoveAbility={handleRemoveAbilityFilter}
        setAbilityFilters={setAbilityFilters}
      />

      <CharacterGrid
        characters={filteredCharacters}
        onUpdated={refreshCharacters}
      />

      <CreateButton onClick={() => setModalOpen(true)} />

      <CreateCharacterModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
