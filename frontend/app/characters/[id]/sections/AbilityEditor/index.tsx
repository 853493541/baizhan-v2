"use client";

import React, { useEffect, useState, useMemo } from "react";
import styles from "./styles.module.css";
import { updateCharacterAbilities } from "@/lib/characterService";
import { createPinyinMap, pinyinFilter } from "@/utils/pinyinSearch";

interface AbilityEditorProps {
  characterId: string;
  abilities?: Record<string, number>;
  onAbilityUpdate?: (ability: string, newLevel: number) => void;
}

export default function AbilityEditor({
  characterId,
  abilities: externalAbilities,
  onAbilityUpdate,
}: AbilityEditorProps) {
  const [abilities, setAbilities] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [loadingAbility, setLoadingAbility] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pinyinMap, setPinyinMap] = useState<
    Record<string, { full: string; short: string }>
  >({});
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  /* ----------------------------------------------------------------------
     🧭 Fetch abilities if not provided
  ---------------------------------------------------------------------- */
  useEffect(() => {
    if (externalAbilities) {
      setAbilities(externalAbilities);
      return;
    }

    async function fetchAbilities() {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/characters/${characterId}`);
        if (!res.ok) throw new Error("Failed to load abilities");
        const data = await res.json();
        setAbilities(data.abilities || {});
      } catch (err) {
        console.error("⚠️ Error fetching abilities", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAbilities();
  }, [characterId, externalAbilities, API_URL]);

  /* ----------------------------------------------------------------------
     🧮 Build Pinyin map lazily when abilities load
  ---------------------------------------------------------------------- */
  useEffect(() => {
    async function buildMap() {
      const abilityNames = Object.keys(abilities);
      if (abilityNames.length === 0) return;
      try {
        const map = await createPinyinMap(abilityNames);
        setPinyinMap(map);
      } catch (err) {
        console.error("⚠️ Error building pinyin map", err);
      }
    }
    buildMap();
  }, [abilities]);

  /* ----------------------------------------------------------------------
     🔍 Filter abilities with Chinese + Pinyin support
  ---------------------------------------------------------------------- */
  const allAbilities = Object.keys(abilities);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return allAbilities.slice(0, 6);
    return pinyinFilter(allAbilities, pinyinMap, term);
  }, [query, allAbilities, pinyinMap]);

  /* ----------------------------------------------------------------------
     ⚙️ Special rule abilities
  ---------------------------------------------------------------------- */
  const specialAbilities = new Set([
      // OFF， will be added back next season
  ]);

  /* ----------------------------------------------------------------------
     🔄 Update ability level
  ---------------------------------------------------------------------- */
  const updateAbility = async (ability: string, newLevel: number) => {
    if (newLevel < 0) return;
    setLoadingAbility(ability);
    try {
      await updateCharacterAbilities(characterId, { [ability]: newLevel });
      setAbilities((prev) => ({ ...prev, [ability]: newLevel }));
      onAbilityUpdate?.(ability, newLevel);
    } catch (err) {
      console.error("⚠️ Error updating ability", err);
    } finally {
      setLoadingAbility(null);
    }
  };

  /* ----------------------------------------------------------------------
     🧱 Render
  ---------------------------------------------------------------------- */
  return (
    <div className={styles.editorContainer}>
      <h3 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "6px" }}>
        搜索技能更新
      </h3>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="输入技能名 / 拼音..."
        className={styles.searchInput}
      />

      {loading ? (
        <p style={{ color: "#888", fontSize: "13px" }}>加载中...</p>
      ) : (
        <div className={styles.wrapper}>
          {filtered.map((name) => {
            const level = abilities[name] || 0;
            const iconPath = `/icons/${name}.png`;
            const isSpecial = specialAbilities.has(name);

            const handlePlus = () =>
              isSpecial
                ? updateAbility(name, 10)
                : updateAbility(name, level + 1);

            const handleMinus = () =>
              isSpecial
                ? updateAbility(name, 0)
                : updateAbility(name, level - 1);

            return (
              <div key={name} className={styles.abilityRow}>
                <img
                  src={iconPath}
                  alt={name}
                  onError={(e) =>
                    ((e.currentTarget as HTMLImageElement).src =
                      "/icons/default.png")
                  }
                />
                <span className={styles.name}>{name}</span>

                <div className={styles.controls}>
                  <button
                    className={styles.minus}
                    disabled={loadingAbility === name}
                    onClick={handleMinus}
                  >
                    −
                  </button>
                  <span className={styles.level}>{level}</span>
                  <button
                    className={styles.plus}
                    disabled={loadingAbility === name}
                    onClick={handlePlus}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <p style={{ color: "#666", fontSize: "13px" }}>未找到匹配技能</p>
          )}
        </div>
      )}
    </div>
  );
}
