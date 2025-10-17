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
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  /** 🧭 Fetch abilities if not provided */
  useEffect(() => {
    if (externalAbilities) {
      setAbilities(externalAbilities);
      return;
    }

    const fetchAbilities = async () => {
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
    };

    fetchAbilities();
  }, [characterId, externalAbilities, API_URL]);

  /** 🧮 Build Pinyin map */
  const pinyinMap = useMemo(
    () => createPinyinMap(Object.keys(abilities)),
    [abilities]
  );

  /** 🔍 Filter with pinyin support */
  const allAbilities = Object.keys(abilities);
  const filtered = query.trim()
    ? pinyinFilter(allAbilities, pinyinMap, query)
    : allAbilities.slice(0, 3); // ✅ show only top 3 by default

  /** 🔄 Update ability */
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

  /** 🧱 UI */
  return (
    <div>
      <h3 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "6px" }}>
        搜索技能更新
      </h3>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="输入技能名..."
        className={styles.searchInput}
      />

      {loading ? (
        <p style={{ color: "#888", fontSize: "13px" }}>加载中...</p>
      ) : (
        <div className={styles.wrapper}>
          {filtered.map((name) => {
            const level = abilities[name] || 0;
            const iconPath = `/icons/${name}.png`;

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
                    onClick={() => updateAbility(name, level - 1)}
                  >
                    −
                  </button>
                  <span className={styles.level}>{level}</span>
                  <button
                    className={styles.plus}
                    disabled={loadingAbility === name}
                    onClick={() => updateAbility(name, level + 1)}
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
