"use client";

import React, { useState } from "react";
import styles from "./styles.module.css";
import AbilityFilterModal from "./AbilityFilterModal";
import Dropdown from "../../../components/layout/dropdown";

interface Props {
  ownerFilter: string;
  serverFilter: string;
  roleFilter: string;
  activeOnly: boolean;
  tradableOnly: boolean;
  nameFilter: string;

  uniqueOwners: string[];
  uniqueServers: string[];

  selectedAbilities: string[];
  globalLevel: number | null;

  setOwnerFilter: (v: string) => void;
  setServerFilter: (v: string) => void;
  setRoleFilter: (v: string) => void;
  setActiveOnly: (v: boolean) => void;
  setTradableOnly: (v: boolean) => void;
  setNameFilter: (v: string) => void;

  onAddAbility: (ability: string, level: number) => void;
  onRemoveAbility: (index: number) => void;
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

export default function CharacterFilters(props: Props) {
  const {
    ownerFilter,
    serverFilter,
    roleFilter,
    activeOnly,
    tradableOnly,
    nameFilter,
    uniqueOwners,
    uniqueServers,
    selectedAbilities,
    globalLevel,
    setOwnerFilter,
    setServerFilter,
    setRoleFilter,
    setActiveOnly,
    setTradableOnly,
    setNameFilter,
    onAddAbility,
    onRemoveAbility,
    setSelectedAbilities,
    onChangeGlobalLevel,
  } = props;

  const [showModal, setShowModal] = useState(false);
  const [extraAbilities, setExtraAbilities] = useState<
    { name: string; icon: string }[]
  >([]);

  const DISPLAY_ABILITIES = [...CORE_ABILITIES, ...extraAbilities];

  const handleAbilityToggle = (ability: string) => {
    const idx = selectedAbilities.indexOf(ability);
    if (idx >= 0) {
      setSelectedAbilities(selectedAbilities.filter((a) => a !== ability));
      onRemoveAbility(idx);
    } else {
      onAddAbility(ability, globalLevel ?? 10);
    }
  };

  const handleGlobalLevelChange = (level: number | null) => {
    onChangeGlobalLevel(level);
    if (level === null) setSelectedAbilities([]);
  };

  const handleConfirmCustom = (abilityName: string) => {
    const exists =
      CORE_ABILITIES.some((a) => a.name === abilityName) ||
      extraAbilities.some((a) => a.name === abilityName);

    if (!exists) {
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
    setNameFilter("");
    setOwnerFilter("");
    setServerFilter("");
    setRoleFilter("");
    setSelectedAbilities([]);
    setActiveOnly(true);
    setTradableOnly(false);
    onChangeGlobalLevel(null);
  };

  return (
    <div className={styles.filterSection}>
      {/* ================= Top Filters ================= */}
      <div className={styles.filterRow}>
        {/* 🔍 Search */}
        <div className={styles.groupSearch}>
          <input
            className={styles.nameInput}
            placeholder="搜索角色名"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          />
        </div>

        {/* 👤 Owner */}
        <div className={styles.groupOwner}>
          <Dropdown
            label="角色"
            options={["全部", ...uniqueOwners]}
            value={ownerFilter || "拥有者"}
            onChange={(val) => setOwnerFilter(val === "全部" ? "" : val)}
          />
        </div>

        {/* 🌍 Server */}
        <div className={styles.groupServer}>
          <Dropdown
            label="服务器"
            options={["全部", ...uniqueServers]}
            value={serverFilter || "服务器"}
            onChange={(val) => setServerFilter(val === "全部" ? "" : val)}
          />
        </div>

        {/* 🎭 Role */}
        <div className={styles.groupRole}>
          {[
            { label: "防御", value: "Tank" },
            { label: "输出", value: "DPS" },
            { label: "治疗", value: "Healer" },
          ].map((opt) => (
            <button
              key={opt.value}
              className={`${styles.filterBtn} ${
                roleFilter === opt.value ? styles.selected : ""
              }`}
              onClick={() =>
                setRoleFilter(roleFilter === opt.value ? "" : opt.value)
              }
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 🔁 Toggles */}
        <div className={styles.groupToggle}>
          <div
            className={styles.boxToggle}
            onClick={() => setActiveOnly(!activeOnly)}
          >
            <div
              className={`${styles.boxSlider} ${
                !activeOnly ? styles.slideRight : ""
              }`}
            />
            <span
              className={`${styles.boxOptionLeft} ${
                activeOnly ? styles.boxTextActive : ""
              }`}
            >
              激活
            </span>
            <span
              className={`${styles.boxOptionRight} ${
                !activeOnly ? styles.boxTextActive : ""
              }`}
            >
              未激活
            </span>
          </div>

          <div
            className={styles.boxToggle}
            onClick={() => setTradableOnly(!tradableOnly)}
          >
            <div
              className={`${styles.boxSlider} ${
                tradableOnly ? styles.slideRight : ""
              }`}
            />
            <span
              className={`${styles.boxOptionLeft} ${
                !tradableOnly ? styles.boxTextActive : ""
              }`}
            >
              全部
            </span>
            <span
              className={`${styles.boxOptionRight} ${
                tradableOnly ? styles.boxTextActive : ""
              }`}
            >
              紫书
            </span>
          </div>
        </div>

        {/* 🖥 Desktop / Tablet Reset */}
        <button
          className={`${styles.resetBtn} ${styles.resetDesktop}`}
          onClick={handleReset}
        >
          重置
        </button>
      </div>

      {/* ================= Abilities ================= */}
      <div className={styles.abilitiesRow}>
        {DISPLAY_ABILITIES.map((a) => {
          const active = selectedAbilities.includes(a.name);
          return (
            <div
              key={a.name}
              className={`${styles.abilityIcon} ${
                active ? styles.active : ""
              }`}
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

      {/* ================= Level ================= */}
      <div className={styles.levelRow}>
        {[8, 9, 10].map((lvl) => (
          <button
            key={lvl}
            className={`${styles.filterBtn} ${
              globalLevel === lvl ? styles.selected : ""
            }`}
            onClick={() =>
              handleGlobalLevelChange(globalLevel === lvl ? null : lvl)
            }
          >
            {lvl}
          </button>
        ))}
      </div>

      {/* 📱 Mobile Reset */}
      <button
        className={`${styles.resetBtn} ${styles.resetMobile}`}
        onClick={handleReset}
      >
        重置
      </button>

      {showModal && (
        <AbilityFilterModal
          onConfirm={handleConfirmCustom}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
