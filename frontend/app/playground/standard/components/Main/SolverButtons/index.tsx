"use client";

import { useRef, useState } from "react";
import { FaCog } from "react-icons/fa";
import styles from "./styles.module.css";
import ConfirmModal from "@/app/components/ConfirmModal";
import SolverOptions from "./SolverOptions";

interface Props {
  solving: boolean;
  disabled?: boolean; // used as locked
  onCore: () => void;
  onFull: () => void;
  onEdit: () => void;

  // SolverOptions props
  allAbilities: { name: string; level: number }[];
  enabledAbilities: Record<string, boolean>;
  setEnabledAbilities: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
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
}: Props) {
  const isLocked = disabled ?? false;

  // 🔒 FULLY HIDE EVERYTHING WHEN LOCKED
  if (isLocked) {
    return null;
  }

  // ──────────────────────────────────
  // 编辑排表 confirm logic
  // ──────────────────────────────────
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

  // ──────────────────────────────────
  // ⚙️ Solver Options controlled modal
  // ──────────────────────────────────
  const [optionsOpen, setOptionsOpen] = useState(false);

  const handleGearClick = () => {
    if (solving) return;
    setOptionsOpen(true);
  };

  return (
    <>
      <div className={styles.solverButtons}>
        {/* ⚙️ 技能选择 */}
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
         intent = "danger"
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
