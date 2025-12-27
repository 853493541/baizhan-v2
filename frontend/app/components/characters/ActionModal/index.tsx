"use client";

import React, { useEffect } from "react";
import styles from "./styles.module.css";
import { toastError, toastSuccess } from "@/app/components/toast/toast";

export interface ActionModalProps {
  tradables: { ability: string; requiredLevel: number }[];
  readables: { ability: string; fromLevel: number; storedLevel: number }[];
  localAbilities: Record<string, number>;
  API_URL: string;
  charId: string;
  onRefresh: () => Promise<void>;
  onClose: () => void;
}

const getAbilityIcon = (name: string) => `/icons/${name}.png`;

// 🈶 Convert number → Chinese numerals
const numToChinese = (num: number): string => {
  const map = ["〇", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  if (num <= 10) return map[num];
  if (num < 20) return "十" + map[num - 10];
  const tens = Math.floor(num / 10);
  const ones = num % 10;
  return `${map[tens]}十${ones ? map[ones] : ""}`;
};

// --- Normalize + force level-10 names ---
const normalize = (s: string) => (s || "").trim().replace(/\u200B/g, "");
const FORCE_LV10_ABILITIES = new Set(
  ["立剑势", "玉魄惊鸾", "剑飞惊天"].map(normalize)
);

export default function ActionModal({
  tradables,
  readables,
  localAbilities,
  API_URL,
  charId,
  onRefresh,
  onClose,
}: ActionModalProps) {
  // ✅ Auto-close if both lists are empty
  useEffect(() => {
    if (tradables.length === 0 && readables.length === 0) {
      onClose();
    }
  }, [tradables, readables, onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  /* ---------------------------------------------------------------
     🧭 Direct Use (NO CONFIRM)
  --------------------------------------------------------------- */
  const handleUse = async (ability: string, level: number) => {
    const name = normalize(ability);
    let finalLevel = level;

    if (FORCE_LV10_ABILITIES.has(name)) {
      finalLevel = 10;
    }

    try {
      const res = await fetch(
        `${API_URL}/api/characters/${charId}/storage/use`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ability, level: finalLevel }),
        }
      );

      if (!res.ok) throw new Error("使用失败");

      // ✅ 成功 toast（你要的文案）
      toastSuccess(`已使用 ${name} · ${finalLevel}重`);

      await onRefresh();
    } catch {
      toastError("使用失败，请稍后再试");
    }
  };

  /* ---------------------------------------------------------------
     📋 Copy text
  --------------------------------------------------------------- */
  const handleCopy = async (ability: string, requiredLevel: number) => {
    const name = normalize(ability);
    let copyLevel = requiredLevel;

    if (FORCE_LV10_ABILITIES.has(name)) {
      copyLevel = 10;
    } else if (copyLevel > 10) {
      copyLevel = 10;
    }

    const chineseLevel = numToChinese(copyLevel);
    const text = `《${name}》招式要诀·${chineseLevel}重`;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      toastError("复制失败，请手动复制");
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>可读书籍</h3>

        {/* === 可读蓝书 === */}
        {readables.length > 0 && (
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>📜 可读蓝书</h4>
            {readables.map(({ ability, storedLevel }) => {
              const current = localAbilities?.[ability] ?? 0;
              return (
                <div key={ability} className={styles.itemRow}>
                  <div className={styles.itemLeft}>
                    <img
                      src={getAbilityIcon(ability)}
                      alt={ability}
                      className={styles.abilityIcon}
                      onError={(e) =>
                        ((e.currentTarget as HTMLImageElement).style.display =
                          "none")
                      }
                    />
                    <span className={styles.abilityLine}>
                      <span className={styles.abilityName}>{ability}</span>
                      <span className={styles.levelInfo}>
                        {storedLevel}重
                        <span className={styles.currentLevel}>
                          {" "} | 当前：{current}重
                        </span>
                      </span>
                    </span>
                  </div>
                  <div className={styles.buttons}>
                    <button
                      onClick={() => handleUse(ability, storedLevel)}
                      className={`${styles.btn} ${styles.useBtn}`}
                    >
                      使用
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* === 可买紫书 === */}
        {tradables.length > 0 && (
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>⚡ 可买紫书</h4>
            {tradables.map(({ ability, requiredLevel }) => {
              const current = localAbilities?.[ability] ?? 0;
              const displayLevel = FORCE_LV10_ABILITIES.has(ability)
                ? 10
                : requiredLevel;

              return (
                <div key={ability} className={styles.itemRow}>
                  <div className={styles.itemLeft}>
                    <img
                      src={getAbilityIcon(ability)}
                      alt={ability}
                      className={styles.abilityIcon}
                      onError={(e) =>
                        ((e.currentTarget as HTMLImageElement).style.display =
                          "none")
                      }
                    />
                    <span className={styles.abilityLine}>
                      <span className={styles.abilityName}>{ability}</span>
                      <span className={styles.levelInfo}>
                        {displayLevel}重
                        <span className={styles.currentLevel}>
                          {" "} | 当前：{current}重
                        </span>
                      </span>
                    </span>
                  </div>
                  <div className={styles.buttons}>
                    <button
                      onClick={() => handleUse(ability, requiredLevel)}
                      className={`${styles.btn} ${styles.useBtn}`}
                    >
                      使用
                    </button>
                    <button
                      onClick={() => handleCopy(ability, requiredLevel)}
                      className={`${styles.btn} ${styles.copyBtn}`}
                    >
                      复制
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.closeButton}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
