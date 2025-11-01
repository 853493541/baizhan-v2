"use client";

import React, { useState } from "react";
import styles from "./styles.module.css";
import { updateCharacterAbilities } from "@/lib/characterService";

interface AbilityHighlightsProps {
  characterId: string;
  abilities: Record<string, number>;
  characterGender?: "male" | "female";
  characterClass?: string;
  onAbilityUpdate?: (ability: string, newLevel: number) => void;
}

/* === Ability definitions with aliases === */
const coreAbilitiesRaw = [
  "斗转金移=斗转",
  "花钱消灾=花钱",
  "黑煞落贪狼=黑煞",
  "蛮熊碎颅击=蛮熊",
  "引燃",
  "一闪天诛=天诛",
  "漾剑式=漾剑",
];

const healerAbilitiesRaw = [
  "万花金创药=万花",
  "特制金创药=特制",
  "短歌垂链=垂链",
  "云海听弦=云海",
  "毓秀灵药=灵药",
  "霞月长针=霞月",
  "皓莲望月=皓莲",
];

/* === 辅助技能 & 可交易技能 === */
const supportAbilitiesRaw = [
  "兔死狐悲=兔死",
  "火焰之种=火焰",
  "阴雷之种=阴雷",
  "阴阳术退散=阴阳",
  "剑心通明=剑心",
  "尸鬼封烬=尸鬼",
];

const tradeAbilitiesRaw = [
  "五行术雷震=雷震",
  "疯狂疾走=疾走",
  "蚀骨之花=蚀骨",
  "帝骖龙翔=帝骖",
  "剑飞惊天=剑飞",
];

/* === Parser for "full=alias" === */
function parseAbilities(rawList: string[]) {
  return rawList.map((entry) => {
    const [full, alias] = entry.split("=");
    return { full, alias: alias || full };
  });
}

const coreAbilities = parseAbilities(coreAbilitiesRaw);
const healerAbilities = parseAbilities(healerAbilitiesRaw);
const supportAbilities = parseAbilities(supportAbilitiesRaw);
const tradeAbilities = parseAbilities(tradeAbilitiesRaw);

function AbilitySection({
  title,
  abilityList,
  abilities,
  characterId,
  onAbilityUpdate,
}: {
  title: string;
  abilityList: { full: string; alias: string }[];
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

  const visible = abilityList.filter((a) => (abilities[a.full] || 0) > 1);
  if (visible.length === 0) return null;

  return (
    <div className={styles.abilitySection}>
      <h3 className={styles.sectionTitle}>{title}</h3>

      <div className={styles.abilityGrid}>
        {visible.map(({ full, alias }) => {
          const level = abilities[full] || 0;
          return (
            <div key={full} className={styles.abilityCard}>
              <img
                src={`/icons/${full}.png`}
                alt={alias}
                className={styles.abilityIcon}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/icons/default.png";
                }}
              />
              <span className={styles.abilityName} title={full}>
                {alias}
              </span>

              <div className={styles.abilityControls}>
                <button
                  className={`${styles.controlButton} ${styles.minus}`}
                  disabled={loadingAbility === full}
                  onClick={() => updateAbility(full, level - 1)}
                >
                  -
                </button>

                <span className={styles.abilityLevel}>{level}</span>

                <button
                  className={`${styles.controlButton} ${styles.plus}`}
                  disabled={loadingAbility === full}
                  onClick={() => updateAbility(full, level + 1)}
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
  characterGender = "male",
  characterClass,
  onAbilityUpdate,
}: AbilityHighlightsProps) {
  /* === 性别过滤 === */
  const filteredSupport = supportAbilities.filter((a) => {
    if (characterGender === "male" && a.full === "剑心通明") return false;
    if (characterGender === "female" && a.full === "尸鬼封烬") return false;
    return true;
  });

  /* === 判断是否治疗门派 === */
  const healerClasses = ["七秀", "万花", "药宗", "五毒", "长歌"];
  const isHealerClass = characterClass && healerClasses.includes(characterClass);

  /* === 如果是治疗门派 → 合并辅助 + 可交易 === */
  const mergedOthers = [...filteredSupport, ...tradeAbilities];

  return (
    <div>
      <AbilitySection
        title="核心技能"
        abilityList={coreAbilities}
        abilities={abilities}
        characterId={characterId}
        onAbilityUpdate={onAbilityUpdate}
      />

      {isHealerClass ? (
        <>
          <AbilitySection
            title="治疗技能"
            abilityList={healerAbilities}
            abilities={abilities}
            characterId={characterId}
            onAbilityUpdate={onAbilityUpdate}
          />
          <AbilitySection
            title="其他技能"
            abilityList={mergedOthers}
            abilities={abilities}
            characterId={characterId}
            onAbilityUpdate={onAbilityUpdate}
          />
        </>
      ) : (
        <>
          <AbilitySection
            title="辅助技能"
            abilityList={filteredSupport}
            abilities={abilities}
            characterId={characterId}
            onAbilityUpdate={onAbilityUpdate}
          />
          <AbilitySection
            title="可交易技能"
            abilityList={tradeAbilities}
            abilities={abilities}
            characterId={characterId}
            onAbilityUpdate={onAbilityUpdate}
          />
        </>
      )}
    </div>
  );
}
