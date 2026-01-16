"use client";

import { useState, useRef } from "react";
import { FaCog } from "react-icons/fa";
import styles from "./styles.module.css";
import SolverOptions from "./SolverOptions";

/* =========================
   Types
========================= */
interface CacheSlot {
  id: number;
}

interface Props {
  solving: boolean;
  disabled?: boolean; // locked
  onCore: () => void;
  onFull: () => void;
  onEdit: () => void;

  // SolverOptions
  allAbilities: { name: string; level: number }[];
  enabledAbilities: Record<string, boolean>;
  setEnabledAbilities: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;

  // 🗂 Temp cache
  cache: (CacheSlot | undefined)[];
  onSaveCache: () => void;
  onRestoreCache: (idx: number) => void;
  onDeleteCache: (idx: number) => void;
}

const CACHE_CAP = 10;
const LONG_PRESS_MS = 600;

export default function SolverButtons({
  solving,
  disabled,
  onCore,
  onFull,
  onEdit,
  allAbilities,
  enabledAbilities,
  setEnabledAbilities,
  cache,
  onSaveCache,
  onRestoreCache,
  onDeleteCache,
}: Props) {
  const isLocked = disabled ?? false;

  // 🔒 HIDE EVERYTHING WHEN LOCKED
  if (isLocked) return null;

  /* =========================
     Solver options
  ========================= */
  const [optionsOpen, setOptionsOpen] = useState(false);

  /* =========================
     Long-press handling (touch)
  ========================= */
  const longPressTimer = useRef<number | null>(null);

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  /* =========================
     Render
  ========================= */
  return (
    <>
      <div className={styles.solverButtons}>
        {/* ⚙️ Ability options */}
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => !solving && setOptionsOpen(true)}
          disabled={solving}
          title="技能选择"
        >
          <FaCog />
        </button>

        {/* 自定义排表 */}
        <button
          type="button"
          className={`${styles.solverBtn} ${styles.lightBtn}`}
          onClick={onCore}
          disabled={solving}
        >
          {solving ? "处理中..." : "自定义排表"}
        </button>

        {/* 全局排表 */}
        <button
          type="button"
          className={`${styles.solverBtn} ${styles.lightBtn}`}
          onClick={() => !solving && onFull()}
          disabled={solving}
        >
          {solving ? "排表中..." : "全局排表"}
        </button>

        {/* =========================
           🗂 Temp Cache (10 slots)
        ========================= */}
        <div className={styles.cacheBar}>
<button
  className={`${styles.solverBtn} ${styles.cacheBtn}`}
  onClick={onSaveCache}
  disabled={solving}
>
  暂时保存
</button>


          <div className={styles.cacheSlots}>
            {Array.from({ length: CACHE_CAP }).map((_, i) => {
              const hasCache = Boolean(cache[i]);

              return (
                <button
                  key={i}
                  className={`${styles.cacheSlot} ${
                    hasCache
                      ? styles.cacheActive
                      : styles.cacheEmpty
                  }`}
                  onClick={() => {
                    if (!hasCache || solving) return;
                    onRestoreCache(i);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (!hasCache || solving) return;
                    onDeleteCache(i);
                  }}
                  onTouchStart={() => {
                    if (!hasCache || solving) return;

                    longPressTimer.current = window.setTimeout(() => {
                      onDeleteCache(i);
                    }, LONG_PRESS_MS);
                  }}
                  onTouchEnd={clearLongPress}
                  onTouchMove={clearLongPress}
                  onTouchCancel={clearLongPress}
                  title={
                    hasCache
                      ? "点击恢复｜右键 / 长按删除"
                      : "空槽位"
                  }
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Solver Options Modal */}
      <SolverOptions
        open={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        disabled={false}
        allAbilities={allAbilities}
        enabledAbilities={enabledAbilities}
        setEnabledAbilities={setEnabledAbilities}
      />
    </>
  );
}
