"use client";

import React from "react";
import styles from "./styles.module.css";

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

// 🈶 Convert level number to Chinese numerals
const numToChinese = (num: number): string => {
  const map = ["〇", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  if (num <= 10) return map[num];
  if (num < 20) return "十" + map[num - 10];
  const tens = Math.floor(num / 10);
  const ones = num % 10;
  return `${map[tens]}十${ones ? map[ones] : ""}`;
};

export default function ActionModal({
  tradables,
  readables,
  localAbilities,
  API_URL,
  charId,
  onRefresh,
  onClose,
}: ActionModalProps) {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleUse = async (ability: string, level: number) => {
    if (!confirm(`确定要使用 ${ability}${level}重 吗？`)) return;
    try {
      const res = await fetch(`${API_URL}/api/characters/${charId}/storage/use`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ability, level }),
      });
      if (!res.ok) throw new Error("使用失败");
      await onRefresh();
    } catch (err) {
      console.error("❌ Failed to use ability:", err);
      alert("使用失败，请稍后再试");
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
                        (e.currentTarget as HTMLImageElement).style.display = "none"
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUse(ability, storedLevel);
                      }}
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
              return (
                <div key={ability} className={styles.itemRow}>
                  <div className={styles.itemLeft}>
                    <img
                      src={getAbilityIcon(ability)}
                      alt={ability}
                      className={styles.abilityIcon}
                      onError={(e) =>
                        (e.currentTarget as HTMLImageElement).style.display = "none"
                      }
                    />
                    <span className={styles.abilityLine}>
                      <span className={styles.abilityName}>{ability}</span>
                      <span className={styles.levelInfo}>
                        {requiredLevel}重
                        <span className={styles.currentLevel}>
                          {" "} | 当前：{current}重
                        </span>
                      </span>
                    </span>
                  </div>
                  <div className={styles.buttons}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUse(ability, requiredLevel);
                      }}
                      className={`${styles.btn} ${styles.useBtn}`}
                    >
                      使用
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const chineseLevel = numToChinese(requiredLevel);
                        navigator.clipboard
                          .writeText(`《${ability}》招式要诀·${chineseLevel}重`)
                          .catch(console.error);
                      }}
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
