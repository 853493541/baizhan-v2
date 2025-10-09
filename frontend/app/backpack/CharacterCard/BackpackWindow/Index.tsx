"use client";

import React from "react";
import styles from "./styles.module.css";

interface StorageItem {
  ability: string;
  level: number;
  used?: boolean;
}

interface Character {
  _id: string;
  abilities?: Record<string, number>;
  storage?: StorageItem[];
}

interface Props {
  char: Character;
  API_URL: string;
}

const getAbilityIcon = (name: string) => `/icons/${name}.png`;

export default function BackpackWindow({ char, API_URL }: Props) {
  const handleUse = async (item: StorageItem) => {
    if (!confirm(`确定要使用 ${item.ability}${item.level}重 吗？`)) return;
    await fetch(`${API_URL}/api/characters/${char._id}/storage/use`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ability: item.ability, level: item.level }),
    });
    alert(`✅ 已使用 ${item.ability}${item.level}重`);
  };

  const handleDelete = async (item: StorageItem) => {
    if (!confirm(`确定要删除 ${item.ability}${item.level}重 吗？`)) return;
    await fetch(`${API_URL}/api/characters/${char._id}/storage/delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ability: item.ability, level: item.level }),
    });
    alert(`🗑️ 已删除 ${item.ability}${item.level}重`);
  };

  // ✅ Sort newest first
  const sortedStorage = [...(char.storage || [])].reverse();

  if (!sortedStorage.length)
    return <p className={styles.empty}>仓库为空</p>;

  return (
    <ul className={styles.itemList}>
      {sortedStorage.map((item, idx) => {
        const currentLevel = char.abilities?.[item.ability] ?? null;
        return (
          <li key={idx} className={styles.itemRow}>
            <div className={styles.itemLeft}>
              <img
                src={getAbilityIcon(item.ability)}
                alt={item.ability}
                className={styles.abilityIcon}
                onError={(e) => ((e.currentTarget.style.display = "none"))}
              />
              <span className={styles.ability}>
                {item.ability} {item.level}重
                {currentLevel !== null && (
                  <span className={styles.currentLevel}>
                    {" "}
                    | 当前：{currentLevel}重
                  </span>
                )}
              </span>
            </div>

            <div className={styles.buttons}>
              {!item.used && (
                <button
                  onClick={() => handleUse(item)}
                  className={styles.useBtn}
                >
                  使用
                </button>
              )}
              <button
                onClick={() => handleDelete(item)}
                className={styles.deleteBtn}
              >
                删除
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
