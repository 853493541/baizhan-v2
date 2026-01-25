"use client";

import React, { useEffect, useRef, useState } from "react";
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

  // ✅ close reason
  onClose: (reason?: "manual" | "empty") => void;
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
const limitChars = (text: string, max = 4) =>
  text ? [...text].slice(0, max).join("") : "";

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
     🔒 HARD HEIGHT LOCK
  ========================= */
  const modalRef = useRef<HTMLDivElement>(null);
  const [lockedHeight, setLockedHeight] = useState<number | null>(null);

  /* =========================
     Safe refresh
  ========================= */
  const safeRefreshPage = async () => {
    if (typeof onRefreshPage === "function") {
      await onRefreshPage();
    }
  };

  /* =========================
     Load tradables
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
      onClose("manual");
    } finally {
      setLoading(false);
    }
  };

  /* initial load */
  useEffect(() => {
    loadTradables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 🔒 lock height ONCE, after first paint */
  useEffect(() => {
    if (!loading && modalRef.current && lockedHeight === null) {
      setLockedHeight(modalRef.current.offsetHeight);
    }
  }, [loading, lockedHeight]);

  /* auto-close when empty */
  useEffect(() => {
    if (!loading && tradables.length === 0) {
      onClose("empty");
      safeRefreshPage();
    }
  }, [loading, tradables]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose("manual");
  };

  /* =========================
     使用
  ========================= */
  const handleUse = async (ability: string, level: number) => {
    const name = normalize(ability);
    const finalLevel = FORCE_LV10_ABILITIES.has(name) ? 10 : level;
    const chineseLevel = numToChinese(finalLevel);

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

      toastSuccess(`已使用 ${name} · ${chineseLevel}重`);

      // 🔁 inner refresh ONLY
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
    const chineseLevel = numToChinese(Math.min(requiredLevel, 10));
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

  const renderRow = (t: TradableAbility) => {
    const isCopied = copiedSet.has(normalize(t.ability));

    return (
      <div key={`tradable-${t.ability}`} className={styles.itemRow}>
        <div className={styles.itemLeft}>
          <img
            src={getAbilityIcon(t.ability)}
            alt={t.ability}
            className={styles.abilityIcon}
            onError={(e) =>
              ((e.currentTarget as HTMLImageElement).style.display = "none")
            }
          />
          <span className={styles.abilityName}>
            {numToChinese(t.requiredLevel)}重 · {limitChars(t.ability, 4)}
          </span>
        </div>

        <div className={styles.currentBadge}>
          当前：{numToChinese(t.currentLevel)}重
        </div>

        <div className={styles.buttons}>
          <button
            onClick={() => handleUse(t.ability, t.requiredLevel)}
            className={`${styles.btn} ${styles.useBtn}`}
            disabled={loading}
          >
            使用
          </button>

          <button
            onClick={() => handleCopy(t.ability, t.requiredLevel)}
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
     Render (NO RESIZE)
  ========================= */
  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        className={styles.modal}
        style={lockedHeight ? { height: lockedHeight } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className={styles.modalTitle}>可读书籍</h3>

        <section className={styles.section}>
          {loading && <div className={styles.innerLoading}>处理中…</div>}

          {!loading && tradablesLv9.length > 0 && (
            <>
              <div className={`${styles.sectionBadge} ${styles.purple9}`}>
                九重紫书
              </div>
              {tradablesLv9.map(renderRow)}
            </>
          )}

          {!loading && tradablesLv10.length > 0 && (
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
          <button
            onClick={() => onClose("manual")}
            className={styles.closeButton}
            disabled={loading}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
