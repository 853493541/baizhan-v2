"use client";

import React from "react";
import styles from "./styles.module.css";

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

const CORE_ABILITIES = [
  { name: "斗转金移", icon: "/icons/斗转金移.png" },
  { name: "黑煞落贪狼", icon: "/icons/黑煞落贪狼.png" },
  { name: "引燃", icon: "/icons/引燃.png" },
  { name: "一闪天诛", icon: "/icons/一闪天诛.png" },
  { name: "花钱消灾", icon: "/icons/花钱消灾.png" },
  { name: "阴阳术退散", icon: "/icons/阴阳术退散.png" },
  { name: "漾剑式", icon: "/icons/漾剑式.png" },
  { name: "兔死狐悲", icon: "/icons/兔死狐悲.png" },
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
  // track global level, but allow abilities to be added even if none chosen
  const globalLevel = abilityFilters[0]?.level;

  const handleAbilityToggle = (ability: string) => {
    const idx = abilityFilters.findIndex((f) => f.ability === ability);
    if (idx !== -1) {
      onRemoveAbility(idx);
    } else {
      // if no global level selected yet, default to 9
      onAddAbility(ability, globalLevel ??10);
    }
  };

  const handleGlobalLevelChange = (level: number) => {
    const currentAbilities = abilityFilters.map((f) => f.ability);
    setAbilityFilters(currentAbilities.map((a) => ({ ability: a, level })));
  };

  return (
    <div className={styles.filters}>
      {/* Row 1: dropdown filters */}
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

      {/* Row 2: ability icons */}
      <div className={styles.abilitiesRow}>
        {CORE_ABILITIES.map((a) => {
          const active = abilityFilters.some((f) => f.ability === a.name);
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

        <button
          className={styles.customButton}
          onClick={() => {
            const abilityName = prompt("输入技能名:");
            if (abilityName) {
              onAddAbility(abilityName, globalLevel ?? 9);
            }
          }}
        >
          + 自定义技能
        </button>
      </div>

      {/* Row 3: global level selector */}
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
    </div>
  );
}
