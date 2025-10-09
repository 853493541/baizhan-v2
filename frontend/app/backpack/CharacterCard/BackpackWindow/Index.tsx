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

const getAbilityIcon = (name: string) => `/icons/${name}.png`;

// ✅ Core abilities
const CORE_ABILITIES = [
  "斗转金移",
  "花钱消灾",
  "黑煞落贪狼",
  "一闪天诛",
  "引燃",
  "漾剑式",
  "阴阳术退散",
  "兔死狐悲",
  "火焰之种",
  "阴雷之种",
  "飞云回转刀",
  "三个铜钱",
  "乾坤一掷",
  "尸鬼封烬",
  "厄毒爆发",
];

interface Props {
  char: Character;
  API_URL: string;
  onRefresh: () => Promise<void>;
  showCoreOnly: boolean;
}

export default function BackpackWindow({
  char,
  API_URL,
  onRefresh,
  showCoreOnly,
}: Props) {
  const runWithRefresh = async (action: () => Promise<void>) => {
    try {
      await action();
      await onRefresh();
    } catch (err) {
      console.error("❌ action failed:", err);
      alert("操作失败，请稍后再试");
    }
  };

  const handleUse = (item: StorageItem) =>
    runWithRefresh(async () => {
      if (!confirm(`确定要使用 ${item.ability}${item.level}重 吗？`)) return;
      const res = await fetch(
        `${API_URL}/api/characters/${char._id}/storage/use`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ability: item.ability, level: item.level }),
        }
      );
      if (!res.ok) throw new Error("使用失败");
    });

  const handleDelete = (item: StorageItem) =>
    runWithRefresh(async () => {
      if (!confirm(`确定要删除 ${item.ability}${item.level}重 吗？`)) return;
      const res = await fetch(
        `${API_URL}/api/characters/${char._id}/storage/delete`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ability: item.ability, level: item.level }),
        }
      );
      if (!res.ok) throw new Error("删除失败");
    });

  // ✅ Sort: Lv9 first, then Lv10
  let items = [...(char.storage || [])].sort((a, b) => {
    if (a.level === 9 && b.level === 10) return -1;
    if (a.level === 10 && b.level === 9) return 1;
    return 0;
  });

  // ✅ When toggled, only show core items inside the card
  if (showCoreOnly) {
    items = items.filter((it) => CORE_ABILITIES.includes(it.ability));
  }

  if (!items.length) return null; // page already filtered characters; safe to render nothing

  return (
    <ul className={styles.itemList}>
      {items.map((item, idx) => {
        const currentLevel = char.abilities?.[item.ability] ?? null;
        const shortName =
          item.ability.length > 4 ? item.ability.slice(0, 4) : item.ability;

        return (
          <li
            key={`${item.ability}-${idx}`}
            className={`${styles.itemRow} ${item.used ? styles.itemUsed : ""}`}
          >
            <div className={styles.itemLeft}>
              <img
                src={getAbilityIcon(item.ability)}
                alt={item.ability}
                className={styles.abilityIcon}
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
              <span className={styles.abilityLine} title={item.ability}>
                <span className={styles.abilityName}>{shortName}</span>
                <span className={styles.levelInfo}>
                  {item.level}重
                  {currentLevel !== null && (
                    <span className={styles.currentLevel}>
                      {" "} | 当前：{currentLevel}重
                    </span>
                  )}
                </span>
              </span>
            </div>

            <div className={styles.buttons}>
              {!item.used && (
                <button
                  onClick={() => handleUse(item)}
                  className={`${styles.btn} ${styles.useBtn}`}
                >
                  使用
                </button>
              )}
              <button
                onClick={() => handleDelete(item)}
                className={`${styles.btn} ${styles.deleteBtn}`}
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
