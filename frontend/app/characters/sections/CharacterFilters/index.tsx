"use client";

import React, { useState } from "react";
import styles from "./styles.module.css";
import AbilityFilterModal from "./AbilityFilterModal";

interface AbilityFilter {
  ability: string;
  level: number;
}

interface Props {
  ownerFilter: string;
  serverFilter: string;
  roleFilter: string;
  uniqueOwners: string[];
  uniqueServers: string[];
  abilityFilters: AbilityFilter[];
  setOwnerFilter: (v: string) => void;
  setServerFilter: (v: string) => void;
  setRoleFilter: (v: string) => void;
  onAddAbility: (ability: string, level: number) => void;
  onRemoveAbility: (i: number) => void;
  setAbilityFilters: React.Dispatch<React.SetStateAction<AbilityFilter[]>>;
}

// Core abilities (with corrected names)
const CORE_ABILITIES = [
  { name: "斗转金移", icon: "/icons/斗转金移.png" },
  { name: "黑煞落贪狼", icon: "/icons/黑煞落贪狼.png" },
  { name: "引燃", icon: "/icons/引燃.png" },
  { name: "一闪天诛", icon: "/icons/一闪天诛.png" },
  { name: "花钱消灾", icon: "/icons/花钱消灾.png" },
  { name: "阴阳术退散", icon: "/icons/阴阳术退散.png" },
  { name: "漾剑式", icon: "/icons/漾剑式.png" },
  { name: "霞月长针", icon: "/icons/霞月长针.png" },
  { name: "特制金创药", icon: "/icons/特制金创药.png" },
];

export default function CharacterFilters({
  ownerFilter,
  serverFilter,
  roleFilter,
  uniqueOwners,
  uniqueServers,
  abilityFilters,
  setOwnerFilter,
  setServerFilter,
  setRoleFilter,
  onAddAbility,
  onRemoveAbility,
  setAbilityFilters,
}: Props) {
  const [selectedAbilities, setSelectedAbilities] = useState<string[]>([]);
  const [globalLevel, setGlobalLevel] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  // session-only custom abilities that should appear as icons
  const [extraAbilities, setExtraAbilities] = useState<
    { name: string; icon: string }[]
  >([]);

  const DISPLAY_ABILITIES = [...CORE_ABILITIES, ...extraAbilities];

  // toggle ability icon
  const handleAbilityToggle = (ability: string) => {
    if (selectedAbilities.includes(ability)) {
      setSelectedAbilities((prev) => prev.filter((a) => a !== ability));
      const idx = abilityFilters.findIndex((f) => f.ability === ability);
      if (idx !== -1) onRemoveAbility(idx);
    } else {
      setSelectedAbilities((prev) => [...prev, ability]);
      if (globalLevel !== null) {
        onAddAbility(ability, globalLevel);
      }
    }
  };

  // level change applies to all currently selected abilities
  const handleGlobalLevelChange = (level: number) => {
    setGlobalLevel(level);
    if (selectedAbilities.length > 0) {
      setAbilityFilters(selectedAbilities.map((a) => ({ ability: a, level })));
    }
  };

  // confirm from modal: add to icons (if not core), select it, and apply level if present
  const handleConfirmCustom = (abilityName: string) => {
    const isCore = CORE_ABILITIES.some((a) => a.name === abilityName);
    const isAlreadyExtra = extraAbilities.some((a) => a.name === abilityName);

    if (!isCore && !isAlreadyExtra) {
      setExtraAbilities((prev) => [
        ...prev,
        { name: abilityName, icon: `/icons/${abilityName}.png` },
      ]);
    }

    if (!selectedAbilities.includes(abilityName)) {
      setSelectedAbilities((prev) => [...prev, abilityName]);
      if (globalLevel !== null) {
        onAddAbility(abilityName, globalLevel);
      }
    }

    setShowModal(false);
  };

  return (
    <div className={styles.filters}>
      {/* Row 1: dropdowns */}
      <div className={styles.filterRow}>
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
      </div>

      {/* Row 2: ability icons (core + session custom) */}
      <div className={styles.abilitiesRow}>
        {DISPLAY_ABILITIES.map((a) => {
          const active = selectedAbilities.includes(a.name);
          return (
            <div
              key={a.name}
              className={`${styles.abilityIcon} ${active ? styles.active : ""}`}
              onClick={() => handleAbilityToggle(a.name)}
            >
              <img src={a.icon} alt={a.name} />
              {active && <span className={styles.checkmark}>✔</span>}
            </div>
          );
        })}

        <button className={styles.customButton} onClick={() => setShowModal(true)}>
          + 自定义技能
        </button>
      </div>

      {/* Row 3: level selector */}
      <div className={styles.levelRow}>
        {[8, 9, 10].map((lvl) => (
          <button
            key={lvl}
            className={`${styles.levelBtn} ${
              globalLevel === lvl ? styles.selected : ""
            }`}
            onClick={() => handleGlobalLevelChange(lvl)}
          >
            {lvl}
          </button>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <AbilityFilterModal
          onConfirm={handleConfirmCustom}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
