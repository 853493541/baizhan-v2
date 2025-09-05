"use client";

import React, { useState } from "react";
import "./AbilityHighlights.css";

interface AbilityHighlightsProps {
  characterId: string;
  abilities: Record<string, number>;
  onAbilityUpdate?: (ability: string, newLevel: number) => void;
}

const coreAbilities = ["斗转金移", "花钱消灾", "黑煞落贪狼", "兔死狐悲", "引燃", "一闪天诛"];
const supportingAbilities = ["漾剑式", "火焰之种", "阴雷之种", "阴阳术退散", "剑心通明", "尸鬼封烬", "水遁水流闪"];
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
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const updateAbility = async (ability: string, newLevel: number) => {
    if (newLevel < 0) return;
    setLoadingAbility(ability);

    try {
      const res = await fetch(`${API_URL}/api/characters/${characterId}/abilities`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abilities: { [ability]: newLevel } }),
      });

      if (!res.ok) {
        console.error("❌ Failed to update ability", await res.text());
        return;
      }

      onAbilityUpdate?.(ability, newLevel);
    } catch (err) {
      console.error("⚠️ Error updating ability", err);
    } finally {
      setLoadingAbility(null);
    }
  };

  const visibleAbilities = abilityList.filter((name) => (abilities[name] || 0) > 1);
  if (visibleAbilities.length === 0) return null;

  return (
    <div className="ability-section">
      <h3>{title}</h3>
      <div className="ability-grid">
        {visibleAbilities.map((name) => {
          const level = abilities[name] || 0;
          const iconPath = `/icons/${name}.png`;

          return (
            <div key={name} className="ability-card">
              <img
                src={iconPath}
                alt={name}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/icons/default.png";
                }}
              />
              <span className="ability-name">{name}</span>
              <div className="ability-controls">
                <button
                  className="minus"
                  disabled={loadingAbility === name}
                  onClick={() => updateAbility(name, level - 1)}
                >
                  -
                </button>
                <span className="ability-level">{level}</span>
                <button
                  className="plus"
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
