"use client";

import React, { useState } from "react";
import styles from "./styles.module.css";
import type { GroupResult } from "@/utils/solver";

import tradableAbilities from "@/app/data/tradable_abilities.json";
const tradableSet = new Set(tradableAbilities as string[]);

interface Selection {
  ability?: string;
  level?: 9 | 10;
  characterId?: string;
  noDrop?: boolean;
}

interface Props {
  floor: number;
  boss: string;
  dropList: string[];
  dropLevel: 9 | 10;
  group: GroupResult;
  onClose: () => void;
  onSave: (floor: number, selection: Selection) => void;
}

const getAbilityIcon = (ability: string) => `/icons/${ability}.png`;

export default function Drops({
  floor,
  boss,
  dropList,
  dropLevel,
  group,
  onClose,
  onSave,
}: Props) {
  const [chosenDrop, setChosenDrop] = useState<
    { ability: string; level: 9 | 10 } | "noDrop" | null
  >(null);

  // ✅ Build options (skip tradables)
  const buildOptions = () => {
    const untradables = dropList.filter((d) => !tradableSet.has(d));
    if (floor >= 81 && floor <= 90) {
      return untradables.map((d) => ({ ability: d, level: 9 as 9 }));
    } else if (floor >= 91 && floor <= 100) {
      return untradables.flatMap((d) => [
        { ability: d, level: 9 as 9 },
        { ability: d, level: 10 as 10 },
      ]);
    }
    return [];
  };

  const options = buildOptions();

  const handleAssign = (charId: string) => {
    if (chosenDrop === "noDrop") {
      onSave(floor, { noDrop: true });
      onClose();
    } else if (chosenDrop) {
      onSave(floor, {
        ability: chosenDrop.ability,
        level: chosenDrop.level,
        characterId: charId,
        noDrop: false,
      });
    }
  };

  // ✅ Check if all characters already have this ability at the required level
  const allHaveAbility = (ability: string, level: 9 | 10) => {
    return group.characters.every((c: any) => {
      const current = c.abilities?.[ability] ?? 0;
      return current >= level;
    });
  };

  // Separate 全有 lists for 9重 and 10重
  const allHave9Options = options.filter(
    (opt) => opt.level === 9 && allHaveAbility(opt.ability, 9)
  );

  const allHave10Options = options.filter(
    (opt) => opt.level === 10 && allHaveAbility(opt.ability, 10)
  );

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* ✅ Title */}
        <h3>
          {floor}层 - {boss}
        </h3>

        <div style={{ display: "flex", gap: "20px" }}>
          {/* ✅ Left column: abilities */}
          <div className={styles.leftColumn}>
            <div className={styles.dropList}>
              {/* === 九重 options first === */}
              <div className={styles.sectionDivider}>九重</div>
              {options
                .filter(
                  (opt) => opt.level === 9 && !allHaveAbility(opt.ability, 9)
                )
                .map((opt, i) => (
                  <button
                    key={`9-${i}`}
                    className={`${styles.dropBtn} ${
                      chosenDrop !== "noDrop" &&
                      (chosenDrop as any)?.ability === opt.ability &&
                      (chosenDrop as any)?.level === opt.level
                        ? styles.activeBtn
                        : ""
                    }`}
                    onClick={() => setChosenDrop(opt)}
                  >
                    <img
                      src={getAbilityIcon(opt.ability)}
                      alt={opt.ability}
                      className={styles.iconSmall}
                    />
                    <span className={styles.dropText}>九重 · {opt.ability}</span>
                  </button>
                ))}

              {/* === Divider === */}
              <div className={styles.sectionDivider}>十重</div>

              {/* === 十重 options next === */}
              {options
                .filter(
                  (opt) => opt.level === 10 && !allHaveAbility(opt.ability, 10)
                )
                .map((opt, i) => (
                  <button
                    key={`10-${i}`}
                    className={`${styles.dropBtn} ${
                      chosenDrop !== "noDrop" &&
                      (chosenDrop as any)?.ability === opt.ability &&
                      (chosenDrop as any)?.level === opt.level
                        ? styles.activeBtn
                        : ""
                    }`}
                    onClick={() => setChosenDrop(opt)}
                  >
                    <img
                      src={getAbilityIcon(opt.ability)}
                      alt={opt.ability}
                      className={styles.iconSmall}
                    />
                    <span className={styles.dropText}>十重 · {opt.ability}</span>
                  </button>
                ))}

              {/* === Divider === */}
              {(allHave9Options.length > 0 || allHave10Options.length > 0) && (
                <div className={styles.sectionDivider}>已有</div>
              )}

              {/* === 九重全有 === */}
              {allHave9Options.map((opt, i) => (
                <button
                  key={`allhave9-${i}`}
                  className={`${styles.dropBtn} ${styles.allHaveBtn}`}
                  onClick={() => {
                    onSave(floor, { noDrop: true });
                    onClose();
                  }}
                >
                  <img
                    src={getAbilityIcon(opt.ability)}
                    alt={opt.ability}
                    className={styles.iconSmall}
                  />
                  <span className={styles.dropText}>
                    九重 · {opt.ability} (全有)
                  </span>
                </button>
              ))}

              {/* === 十重全有 === */}
              {allHave10Options.map((opt, i) => (
                <button
                  key={`allhave10-${i}`}
                  className={`${styles.dropBtn} ${styles.allHaveBtn}`}
                  onClick={() => {
                    onSave(floor, { noDrop: true });
                    onClose();
                  }}
                >
                  <img
                    src={getAbilityIcon(opt.ability)}
                    alt={opt.ability}
                    className={styles.iconSmall}
                  />
                  <span className={styles.dropText}>
                    十重 · {opt.ability} (全有)
                  </span>
                </button>
              ))}

              {/* === Divider === */}
              <div className={styles.sectionDivider}>无掉落</div>

              {/* === 无掉落 === */}
              <button
                className={styles.noDropBtn}
                onClick={() => {
                  onSave(floor, { noDrop: true });
                  onClose();
                }}
              >
                无掉落/紫书
              </button>
            </div>
          </div>

          {/* ✅ Right column: characters */}
          <div className={styles.rightColumn}>
            <div className={styles.sectionDivider}>角色</div>
            <div className={styles.memberGrid}>
              {group.characters.map((c: any) => {
                let levelDisplay: string | null = null;
                let disabled = !chosenDrop; // lock if nothing picked

                if (chosenDrop && chosenDrop !== "noDrop") {
                  const currentLevel = c.abilities?.[chosenDrop.ability] ?? 0;
                  levelDisplay = `${currentLevel}重`;
                  if (currentLevel >= chosenDrop.level) {
                    disabled = true; // ✅ already has this level or higher
                  }
                }

                return (
                  <button
                    key={c._id || c.id}
                    className={`${styles.memberBtn} ${
                      disabled ? styles.memberDisabled : ""
                    }`}
                    onClick={() => !disabled && handleAssign(c._id || c.id)}
                    disabled={disabled}
                  >
                    {c.name || c._id}
                    {levelDisplay && <span> ({levelDisplay})</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ✅ Close at bottom-right */}
        <div className={styles.footer}>
          <button onClick={onClose} className={styles.closeBtn}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
