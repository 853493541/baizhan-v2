"use client";

import React, { useState } from "react";
import styles from "./styles.module.css";
import AbilityFilterModal from "./AbilityFilterModal";
import Dropdown from "../../../components/layout/dropdown";

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
  selectedAbilities: string[];
  globalLevel: number | null;

  setOwnerFilter: (v: string) => void;
  setServerFilter: (v: string) => void;
  setRoleFilter: (v: string) => void;

  onAddAbility: (ability: string, level: number) => void;
  onRemoveAbility: (i: number) => void;
  setAbilityFilters: React.Dispatch<React.SetStateAction<AbilityFilter[]>>;
  setSelectedAbilities: (arr: string[]) => void;
  onChangeGlobalLevel: (lvl: number | null) => void;
}

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
  selectedAbilities,
  globalLevel,
  setOwnerFilter,
  setServerFilter,
  setRoleFilter,
  onAddAbility,
  onRemoveAbility,
  setAbilityFilters,
  setSelectedAbilities,
  onChangeGlobalLevel,
}: Props) {
  console.log("[CharacterFilters] render start", {
    ownerFilter,
    serverFilter,
    roleFilter,
    selectedAbilities,
    globalLevel,
    abilityFilters,
  });

  const [showModal, setShowModal] = useState(false);
  const [extraAbilities, setExtraAbilities] = useState<{ name: string; icon: string }[]>([]);

  const DISPLAY_ABILITIES = [...CORE_ABILITIES, ...extraAbilities];

  const handleAbilityToggle = (ability: string) => {
    console.log("[CharacterFilters] toggle ability", ability);
    const idx = selectedAbilities.indexOf(ability);
    if (idx >= 0) {
      const next = selectedAbilities.filter((a) => a !== ability);
      setSelectedAbilities(next);
      const idxInFilters = abilityFilters.findIndex((f) => f.ability === ability);
      if (idxInFilters !== -1) onRemoveAbility(idxInFilters);
    } else {
      onAddAbility(ability, globalLevel ?? 10);
    }
  };

  const handleGlobalLevelChange = (level: number | null) => {
    console.log("[CharacterFilters] global level change", level);
    onChangeGlobalLevel(level);
    if (level !== null && selectedAbilities.length > 0) {
      setAbilityFilters(selectedAbilities.map((a) => ({ ability: a, level })));
    } else {
      setAbilityFilters([]);
    }
  };

  const handleConfirmCustom = (abilityName: string) => {
    console.log("[CharacterFilters] confirm custom ability", abilityName);
    const isCore = CORE_ABILITIES.some((a) => a.name === abilityName);
    const isAlreadyExtra = extraAbilities.some((a) => a.name === abilityName);

    if (!isCore && !isAlreadyExtra) {
      setExtraAbilities((prev) => [
        ...prev,
        { name: abilityName, icon: `/icons/${abilityName}.png` },
      ]);
    }

    if (!selectedAbilities.includes(abilityName)) {
      onAddAbility(abilityName, globalLevel ?? 10);
    }

    setShowModal(false);
  };

  const handleReset = () => {
    console.log("[CharacterFilters] reset pressed");
    setOwnerFilter("");
    setServerFilter("");
    setRoleFilter("");
    setSelectedAbilities([]);
    setAbilityFilters([]);
    onChangeGlobalLevel(null);
    localStorage.removeItem("characterFilters"); // ✅ also clear saved filters
  };

  return (
    <div className={styles.filterSection}>
      <div className={styles.filterRow}>
        <Dropdown
          label="拥有者"
          options={uniqueOwners}
          value={ownerFilter}
          onChange={setOwnerFilter}
        />

        <Dropdown
          label="服务器"
          options={uniqueServers}
          value={serverFilter}
          onChange={setServerFilter}
        />

        {[{ label: "防御", value: "T" }, { label: "输出", value: "DPS" }, { label: "治疗", value: "Healer" }].map(
          (opt) => (
            <button
              key={opt.value}
              className={`${styles.filterBtn} ${roleFilter === opt.value ? styles.selected : ""}`}
              onClick={() => setRoleFilter(roleFilter === opt.value ? "" : opt.value)}
            >
              {opt.label}
            </button>
          )
        )}

        <button className={styles.resetBtn} onClick={handleReset}>
          重置
        </button>
      </div>

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

        <button className={styles.addButton} onClick={() => setShowModal(true)}>
          +
        </button>
      </div>

      <div className={styles.levelRow}>
        {[8, 9, 10].map((lvl) => (
          <button
            key={lvl}
            className={`${styles.filterBtn} ${globalLevel === lvl ? styles.selected : ""}`}
            aria-pressed={globalLevel === lvl}
            onClick={() => handleGlobalLevelChange(globalLevel === lvl ? null : lvl)}
          >
            {lvl}
          </button>
        ))}
      </div>

      {showModal && (
        <AbilityFilterModal onConfirm={handleConfirmCustom} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
