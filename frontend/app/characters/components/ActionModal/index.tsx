"use client";

import React, { useEffect, useState } from "react";
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

const normalize = (s: string) => (s || "").trim().replace(/\u200B/g, "");

const FORCE_LV10_ABILITIES = new Set<string>();

export default function ActionModal({
  tradables,
  readables,
  localAbilities,
  API_URL,
  charId,
  onRefresh,
  onClose,
}: ActionModalProps) {
  const [copiedSet, setCopiedSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (tradables.length === 0 && readables.length === 0) {
      onClose();
    }
  }, [tradables, readables, onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  /* ------------------ 使用 ------------------ */
  const handleUse = async (ability: string, level: number) => {
    const name = normalize(ability);
    let finalLevel = level;

    if (FORCE_LV10_ABILITIES.has(name)) finalLevel = 10;

    try {
      const res = await fetch(
        `${API_URL}/api/characters/${charId}/storage/use`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ability, level: finalLevel }),
        }
      );

      if (!res.ok) throw new Error();

      toastSuccess(`已使用 ${name} · ${finalLevel}重`);
      await onRefresh();
    } catch {
      toastError("使用失败，请稍后再试");
    }
  };

  /* ------------------ 复制 ------------------ */
  const handleCopy = async (ability: string, requiredLevel: number) => {
    const name = normalize(ability);
    const safeLevel = Math.min(requiredLevel, 10);
    const chineseLevel = numToChinese(safeLevel);
    const text = `《${name}》招式要诀·${chineseLevel}重`;

    try {
      await navigator.clipboard.writeText(text);
      toastSuccess("已复制");

      setCopiedSet(prev => {
        const next = new Set(prev);
        next.add(name);
        return next;
      });
    } catch {
      toastError("复制失败");
    }
  };

  const tradablesLv9 = tradables.filter(t => t.requiredLevel === 9);
  const tradablesLv10 = tradables.filter(t => t.requiredLevel === 10);

  /* ------------------ 行渲染 ------------------ */
  const renderRow = (
    ability: string,
    targetLevel: number,
    current: number,
    showCopy: boolean
  ) => {
    const isCopied = copiedSet.has(normalize(ability));

    const levelText = numToChinese(targetLevel);
    const currentText = numToChinese(current);

    return (
      <div className={styles.itemRow}>
        <div className={styles.itemLeft}>
          <img
            src={getAbilityIcon(ability)}
            alt={ability}
            className={styles.abilityIcon}
            onError={(e) =>
              ((e.currentTarget as HTMLImageElement).style.display = "none")
            }
          />

          <span className={styles.abilityLine}>
            {showCopy ? (
              <span className={styles.abilityName}>
                {levelText}重 · {ability}
              </span>
            ) : (
              <>
                <span className={styles.abilityName}>{ability}</span>
                <span className={styles.levelInfo}>{levelText}重</span>
              </>
            )}
          </span>
        </div>

        {/* 当前等级（中文） */}
        <div className={styles.currentBadge}>
          当前：{currentText}重
        </div>

        <div className={styles.buttons}>
          <button
            onClick={() => handleUse(ability, targetLevel)}
            className={`${styles.btn} ${styles.useBtn}`}
          >
            使用
          </button>

          {showCopy && (
            <button
              onClick={() => handleCopy(ability, targetLevel)}
              className={`${styles.btn} ${
                isCopied ? styles.copiedBtn : styles.copyBtn
              }`}
            >
              {isCopied ? "已复制" : "复制"}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>可读书籍</h3>

        {readables.length > 0 && (
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>
              <span className={`${styles.sectionBadge} ${styles.blue}`}>
                蓝书
              </span>
            </h4>
            {readables.map(({ ability, storedLevel }) =>
              renderRow(
                ability,
                storedLevel,
                localAbilities?.[ability] ?? 0,
                true
              )
            )}
          </section>
        )}

        {tradables.length > 0 && (
          <section className={styles.section}>
            {tradablesLv9.length > 0 && (
              <>
                <div className={`${styles.sectionBadge} ${styles.purple9}`}>
                  九重紫书
                </div>
                {tradablesLv9.map(t =>
                  renderRow(
                    t.ability,
                    t.requiredLevel,
                    localAbilities?.[t.ability] ?? 0,
                    true
                  )
                )}
              </>
            )}

            {tradablesLv10.length > 0 && (
              <>
                <div
                  className={`${styles.sectionBadge} ${styles.purple10} ${styles.sectionGap}`}
                >
                  十重紫书
                </div>
                {tradablesLv10.map(t =>
                  renderRow(
                    t.ability,
                    t.requiredLevel,
                    localAbilities?.[t.ability] ?? 0,
                    true
                  )
                )}
              </>
            )}
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
