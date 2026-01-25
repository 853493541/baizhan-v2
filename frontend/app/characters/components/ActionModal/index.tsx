"use client";

import React, { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { toastError, toastSuccess } from "@/app/components/toast/toast";

/* =========================
   Types
========================= */
export interface TradableAbility {
  ability: string;
  requiredLevel: number;
  currentLevel: number;
}

export interface ActionModalProps {
  API_URL: string;
  charId: string;

  // 🔁 page-level refresh (recalc hasActions)
  onRefreshPage: () => Promise<void>;
  onClose: () => void;
}

const getAbilityIcon = (name: string) => `/icons/${name}.png`;

/* 🈶 Convert number → Chinese numerals */
const numToChinese = (num: number): string => {
  const map = ["〇", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  if (num <= 10) return map[num];
  if (num < 20) return "十" + map[num - 10];
  const tens = Math.floor(num / 10);
  const ones = num % 10;
  return `${map[tens]}十${ones ? map[ones] : ""}`;
};

const normalize = (s: string) => (s || "").trim().replace(/\u200B/g, "");

/* ✅ EXACT character limit (CJK-safe) */
const limitChars = (text: string, max = 4) =>
  text ? [...text].slice(0, max).join("") : "";

// ⚠️ Reserved for future special rules
const FORCE_LV10_ABILITIES = new Set<string>();

export default function ActionModal({
  API_URL,
  charId,
  onRefreshPage,
  onClose,
}: ActionModalProps) {
  const [tradables, setTradables] = useState<TradableAbility[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedSet, setCopiedSet] = useState<Set<string>>(new Set());

  /* =========================
     🔒 Defensive refresh wrapper
     (prevents "r is not a function")
  ========================= */
  const safeRefreshPage = async () => {
    if (typeof onRefreshPage === "function") {
      await onRefreshPage();
    }
  };

  /* =========================
     Load tradables on open
  ========================= */
  const loadTradables = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${API_URL}/api/characters/${charId}/tradables`
      );
      if (!res.ok) throw new Error();

      const data = await res.json();
      setTradables(data.tradables || []);
    } catch {
      toastError("加载可读书籍失败");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTradables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================
     Auto-close if nothing left
  ========================= */
  useEffect(() => {
    if (!loading && tradables.length === 0) {
      onClose();
      safeRefreshPage();
    }
  }, [loading, tradables, onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  /* =========================
     使用
  ========================= */
  const handleUse = async (ability: string, level: number) => {
    const name = normalize(ability);
    let finalLevel = FORCE_LV10_ABILITIES.has(name) ? 10 : level;

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

      // 🔁 refresh modal + page
      await loadTradables();
      await safeRefreshPage();
    } catch {
      toastError("使用失败，请稍后再试");
    }
  };

  /* =========================
     复制
  ========================= */
  const handleCopy = async (ability: string, requiredLevel: number) => {
    const name = normalize(ability);
    const safeLevel = Math.min(requiredLevel, 10);
    const chineseLevel = numToChinese(safeLevel);
    const text = `《${name}》招式要诀·${chineseLevel}重`;

    try {
      await navigator.clipboard.writeText(text);
      toastSuccess("已复制技能书名称");

      setCopiedSet((prev) => {
        const next = new Set(prev);
        next.add(name);
        return next;
      });
    } catch {
      toastError("复制失败");
    }
  };

  const tradablesLv9 = tradables.filter((t) => t.requiredLevel === 9);
  const tradablesLv10 = tradables.filter((t) => t.requiredLevel === 10);

  /* =========================
     行渲染
  ========================= */
  const renderRow = (t: TradableAbility) => {
    const { ability, requiredLevel, currentLevel } = t;
    const isCopied = copiedSet.has(normalize(ability));

    return (
      <div key={`tradable-${ability}`} className={styles.itemRow}>
        <div className={styles.itemLeft}>
          <img
            src={getAbilityIcon(ability)}
            alt={ability}
            className={styles.abilityIcon}
            onError={(e) =>
              ((e.currentTarget as HTMLImageElement).style.display = "none")
            }
          />
          <span className={styles.abilityName}>
            {numToChinese(requiredLevel)}重 · {limitChars(ability, 4)}
          </span>
        </div>

        <div className={styles.currentBadge}>
          当前：{numToChinese(currentLevel)}重
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
            className={`${styles.btn} ${
              isCopied ? styles.copiedBtn : styles.copyBtn
            }`}
          >
            复制
          </button>
        </div>
      </div>
    );
  };

  /* =========================
     Render
  ========================= */
  if (loading) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <div className={styles.loading}>加载中…</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>可读书籍</h3>

        <section className={styles.section}>
          {tradablesLv9.length > 0 && (
            <>
              <div className={`${styles.sectionBadge} ${styles.purple9}`}>
                九重紫书
              </div>
              {tradablesLv9.map(renderRow)}
            </>
          )}

          {tradablesLv10.length > 0 && (
            <>
              <div
                className={`${styles.sectionBadge} ${styles.purple10} ${styles.sectionGap}`}
              >
                十重紫书
              </div>
              {tradablesLv10.map(renderRow)}
            </>
          )}
        </section>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.closeButton}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
