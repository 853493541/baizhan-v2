"use client";

import React, { useState } from "react";
import styles from "./styles.module.css";
import { updateCharacterAbilities } from "@/lib/characterService";

interface AbilityHighlightsProps {
  characterId: string;
  abilities: Record<string, number>;
  onAbilityUpdate?: (ability: string, newLevel: number) => void;
}

const coreAbilities = ["斗转金移", "花钱消灾", "黑煞落贪狼", "兔死狐悲", "引燃", "一闪天诛"];
const supportingAbilities = [
  "漾剑式",
  "火焰之种",
  "阴雷之种",
  "阴阳术退散",
  "剑心通明",
  "尸鬼封烬",
  "水遁水流闪",
];
const tradeableAbilities = ["五行术雷震", "疯狂疾走", "蚀骨之花", "帝骖龙翔", "剑飞惊天"];

function AbilitySection({
  title,
  abilityList,
  abilities,
  characterId,
  onAbilityUpdate,
}: {
  title: string;
  abilityList: string[];
  abilities: Record<string, number>;
  characterId: string;
  onAbilityUpdate?: (ability: string, newLevel: number) => void;
}) {
  const [loadingAbility, setLoadingAbility] = useState<string | null>(null);

  const updateAbility = async (ability: string, newLevel: number) => {
    if (newLevel < 0) return;
    setLoadingAbility(ability);
    try {
      await updateCharacterAbilities(characterId, { [ability]: newLevel });
      onAbilityUpdate?.(ability, newLevel);
    } catch (err) {
      console.error("⚠️ Error updating ability", err);
    } finally {
      setLoadingAbility(null);
    }
  };

  const visible = abilityList.filter((name) => (abilities[name] || 0) > 1);
  if (visible.length === 0) return null;

  return (
    <div className={styles.abilitySection}>
      <h3 className={styles.sectionTitle}>{title}</h3>

      <div className={styles.abilityGrid}>
        {visible.map((name) => {
          const level = abilities[name] || 0;
          return (
            <div key={name} className={styles.abilityCard}>
              <img
                src={`/icons/${name}.png`}
                alt={name}
                className={styles.abilityIcon}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/icons/default.png";
                }}
              />

              <span className={styles.abilityName}>{name}</span>

              <div className={styles.abilityControls}>
                <button
                  className={`${styles.controlButton} ${styles.minus}`}
                  disabled={loadingAbility === name}
                  onClick={() => updateAbility(name, level - 1)}
                >
                  -
                </button>

                <span className={styles.abilityLevel}>{level}</span>

                <button
                  className={`${styles.controlButton} ${styles.plus}`}
                  disabled={loadingAbility === name}
                  onClick={() => updateAbility(name, level + 1)}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AbilityHighlights({
  characterId,
  abilities,
  onAbilityUpdate,
}: AbilityHighlightsProps) {
  return (
    <div>
      <AbilitySection
        title="核心技能"
        abilityList={coreAbilities}
        abilities={abilities}
        characterId={characterId}
        onAbilityUpdate={onAbilityUpdate}
      />
      <AbilitySection
        title="辅助技能"
        abilityList={supportingAbilities}
        abilities={abilities}
        characterId={characterId}
        onAbilityUpdate={onAbilityUpdate}
      />
      <AbilitySection
        title="可交易技能"
        abilityList={tradeableAbilities}
        abilities={abilities}
        characterId={characterId}
        onAbilityUpdate={onAbilityUpdate}
      />
    </div>
  );
}
