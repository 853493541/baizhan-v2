"use client";

import React, { useState } from "react";
import { FaCog } from "react-icons/fa";
import styles from "./styles.module.css";

interface AbilityItem {
  name: string;
  level: number;
}

interface Props {
  disabled?: boolean;   // ⭐ NEW
  allAbilities?: AbilityItem[];
  enabledAbilities: Record<string, boolean>;
  setEnabledAbilities: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
}

const getAbilityIcon = (ability: string) => `/icons/${ability}.png`;

export const CORE_ABILITIES = [
  "斗转金移",
  "花钱消灾",
  "黑煞落贪狼",
  "一闪天诛",
  "引燃",
  "漾剑式",
  "阴阳术退散",
  "兔死狐悲",
];

export const GOOD_ABILITIES = [
  "特制金创药",
  "万花金创药",
  "初景白雨",
  "定波式",
  "毓秀灵药",
  "霞月长针",
  "剑心通明",
  "飞云回转刀",
  "尸鬼封烬",
  "血龙甩尾",
  "七荒黑牙",
  "三个铜钱",
  "乾坤一掷",
  "厄毒爆发",
  "坠龙惊鸿",
  "火焰之种",
  "阴雷之种",
  "短歌万劫",
  "泉映幻歌",
];

export default function SolverOptions({
  disabled = false,
  allAbilities = [],
  enabledAbilities,
  setEnabledAbilities,
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeLevel, setActiveLevel] = useState<9 | 10>(9);
  const [warned, setWarned] = useState(false); // ⭐ only warn once

  const getKey = (name: string, level: number) => `${name}-${level}`;

  const handleGearClick = () => {
    if (!disabled) {
      setOpen(true);
      return;
    }

    // 🔒 Locked: warn once per session
    if (!warned) {
      alert("当前排表已锁定，调整技能可能无效。");
      setWarned(true);
    }
    setOpen(true);
  };

  const toggleAbility = (name: string, level: number) => {
    const key = getKey(name, level);
    setEnabledAbilities((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const level9 = allAbilities.filter((a) => a.level === 9);
  const level10 = allAbilities.filter((a) => a.level === 10);

  const splitByCategory = (list: AbilityItem[]) => {
    const core = list.filter((a) => CORE_ABILITIES.includes(a.name));
    const good = list.filter((a) => GOOD_ABILITIES.includes(a.name));
    const others = list.filter(
      (a) =>
        !CORE_ABILITIES.includes(a.name) &&
        !GOOD_ABILITIES.includes(a.name)
    );
    return { core, good, others };
  };

  const renderAbilities = (list: AbilityItem[]) => (
    <div className={styles.iconGrid}>
      {list.map((a) => {
        const key = getKey(a.name, a.level);
        const checked = enabledAbilities[key] ?? true;
        return (
          <div
            key={key}
            className={`${styles.iconBox} ${checked ? styles.selected : styles.dimmed}`}
            onClick={() => toggleAbility(a.name, a.level)}
          >
            <div className={styles.iconWrapper}>
              <img
                src={getAbilityIcon(a.name)}
                alt={a.name}
                className={`${styles.icon} ${checked ? styles.activeIcon : ""}`}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              {checked && <div className={styles.checkmark}>✓</div>}
            </div>
            <div className={styles.abilityName}>{a.name}</div>
          </div>
        );
      })}
    </div>
  );

  const renderSubCatalog = (list: AbilityItem[], level: number) => {
    if (!list.length) return null;
    const allSelected = list.every((a) => enabledAbilities[getKey(a.name, level)] ?? true);

    const handleToggleAll = () => {
      const newValue = !allSelected;
      setEnabledAbilities((prev) => {
        const updated = { ...prev };
        list.forEach((a) => (updated[getKey(a.name, level)] = newValue));
        return updated;
      });
    };

    return (
      <>
        <div className={styles.subHeader}>
          <button
            className={`${styles.toggleAllBtn} ${allSelected ? styles.activeToggle : ""}`}
            onClick={handleToggleAll}
          >
            全选
          </button>
        </div>
        {renderAbilities(list)}
      </>
    );
  };

  const renderActiveLevel = (level: number, list: AbilityItem[]) => {
    const { core, good, others } = splitByCategory(list);
    return (
      <div className={styles.levelSection}>
        {core.length > 0 && (
          <>
            {renderSubCatalog(core, level)}
            <div className={styles.dividerLine}></div>
          </>
        )}
        {good.length > 0 && (
          <>
            {renderSubCatalog(good, level)}
            <div className={styles.dividerLine}></div>
          </>
        )}
        {others.length > 0 && renderSubCatalog(others, level)}
      </div>
    );
  };

  const activeList = activeLevel === 9 ? level9 : level10;

  return (
    <>
      {/* ⚙️ Gear icon — now supports gray when disabled */}
      <button
        className={`${styles.iconBtn} ${disabled ? styles.lockedBtn : ""}`}
        onClick={handleGearClick}
        title="打开技能选择"
      >
        <FaCog />
      </button>

      {open && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <button className={styles.closeBtn} onClick={() => setOpen(false)}>
              ✕
            </button>

            <div className={styles.tabBar}>
              <button
                className={`${styles.tabBtn} ${activeLevel === 9 ? styles.activeTab : ""}`}
                onClick={() => setActiveLevel(9)}
              >
                九重
              </button>
              <button
                className={`${styles.tabBtn} ${activeLevel === 10 ? styles.activeTab : ""}`}
                onClick={() => setActiveLevel(10)}
              >
                十重
              </button>
            </div>

            {renderActiveLevel(activeLevel, activeList)}

            <div className={styles.modalActions}>
              <button className={styles.confirmBtn} onClick={() => setOpen(false)}>
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
