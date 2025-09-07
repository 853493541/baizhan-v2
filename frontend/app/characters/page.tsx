"use client";

import { useEffect, useState } from "react";
import CreateCharacterModal from "./CreateCharacterModal";
import CharacterCard from "./CharacterCard";
import AbilityFilterModal from "./AbilityFilterModal";
import { Character } from "@/types/Character";
import styles from "./page.module.css";
import { normalizeGender } from "@/utils/normalize";

export default function CharacterStoragePage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setModalOpen] = useState(false);
  const [isAbilityModalOpen, setAbilityModalOpen] = useState(false);

  // Filters
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

  // Dynamic lists
  const uniqueOwners = Array.from(
    new Set(characters.map((c) => c.owner || "Unknown"))
  ).sort();
  const uniqueServers = Array.from(new Set(characters.map((c) => c.server))).sort();

  // Filtering
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
    setAbilityFilters([...abilityFilters, { ability, level }]);
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
      <h1 className={styles.title}>角色仓库</h1>

      {/* Filters */}
      <div className={styles.filters}>
        {/* Owner */}
        <select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          className={styles.select}
        >
          <option value="">所有拥有者</option>
          {uniqueOwners.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>

        {/* Server */}
        <select
          value={serverFilter}
          onChange={(e) => setServerFilter(e.target.value)}
          className={styles.select}
        >
          <option value="">所有服务器</option>
          {uniqueServers.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Role */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className={styles.select}
        >
          <option value="">所有定位</option>
          <option value="Tank">Tank</option>
          <option value="DPS">DPS</option>
          <option value="Healer">Healer</option>
        </select>

        {/* Ability filter trigger */}
        <button
          onClick={() => setAbilityModalOpen(true)}
          className={styles.addButton}
        >
          + 添加技能筛选
        </button>

        {/* Active ability filters */}
        <div className={styles.activeFilters}>
          {abilityFilters.map((f, i) => (
            <span key={i} className={styles.filterChip}>
              {f.ability} = {f.level}
              <button onClick={() => handleRemoveAbilityFilter(i)}>❌</button>
            </span>
          ))}
        </div>
      </div>

      {/* Characters */}
      <div className={styles.cardGrid}>
        {filteredCharacters.map((char) => (
          <CharacterCard
            key={char._id}
            character={char}
            onUpdated={refreshCharacters}
          />
        ))}
      </div>

      {/* Create new character */}
      <div className={styles.createButtonWrapper}>
        <button
          onClick={() => setModalOpen(true)}
          className={styles.createButton}
        >
          + 新建角色
        </button>
      </div>

      <CreateCharacterModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={() => refreshCharacters()}
      />

      {/* Ability Filter Modal */}
      {isAbilityModalOpen && (
        <AbilityFilterModal
          onConfirm={handleAddAbilityFilter}
          onClose={() => setAbilityModalOpen(false)}
        />
      )}
    </div>
  );
}
