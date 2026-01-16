"use client";

import { useRef, useState } from "react";
import { FaCog } from "react-icons/fa";
import styles from "./styles.module.css";
import ConfirmModal from "@/app/components/ConfirmModal";
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
  cache: CacheSlot[];
  onSaveCache: () => void;
  onRestoreCache: (idx: number) => void;
}

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
}: Props) {
  const isLocked = disabled ?? false;

  // 🔒 HIDE EVERYTHING WHEN LOCKED
  if (isLocked) {
    return null;
  }

  /* =========================
     Manual edit confirm
  ========================= */
  const warnedRef = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleEditClick = () => {
    if (solving) return;

    if (warnedRef.current) {
      onEdit();
      return;
    }

    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    warnedRef.current = true;
    setConfirmOpen(false);
    onEdit();
  };

  /* =========================
     Solver options
  ========================= */
  const [optionsOpen, setOptionsOpen] = useState(false);

  const handleGearClick = () => {
    if (solving) return;
    setOptionsOpen(true);
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
          onClick={handleGearClick}
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
           🗂 Temp Cache
        ========================= */}
        <div className={styles.cacheBar}>
          <button
            className={styles.cacheSaveBtn}
            onClick={onSaveCache}
            disabled={solving}
          >
            暂时保存
          </button>

          <div className={styles.cacheSlots}>
            {Array.from({ length: 5 }).map((_, i) => {
              const hasCache = Boolean(cache[i]);

              return (
                <button
                  key={i}
                  className={`${styles.cacheSlot} ${
                    hasCache
                      ? styles.cacheActive
                      : styles.cacheEmpty
                  }`}
                  disabled={!hasCache || solving}
                  onClick={() => onRestoreCache(i)}
                  title={
                    hasCache
                      ? `恢复暂存排表 ${i + 1}`
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

      {/* 编辑排表确认 */}
      {confirmOpen && (
        <ConfirmModal
          intent="danger"
          title="确认编辑排表"
          message="当前排表已锁定，确定要继续编辑吗？"
          confirmText="继续编辑"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}
