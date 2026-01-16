"use client";

import { useRef, useState } from "react";
import styles from "./styles.module.css";
import ConfirmModal from "@/app/components/ConfirmModal";

interface Props {
  finished: number;
  total: number;
  locked: boolean;
  onManualEdit: () => void;
}

export default function ControlBar({
  finished,
  total,
  locked,
  onManualEdit,
}: Props) {
  const progress =
    total === 0 ? 0 : Math.round((finished / total) * 100);

  // ⭐ warn-once-per-session
  const manualWarnedRef = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleManualClick = () => {
    if (!locked) {
      onManualEdit();
      return;
    }

    if (manualWarnedRef.current) {
      onManualEdit();
      return;
    }

    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    manualWarnedRef.current = true;
    setConfirmOpen(false);
    onManualEdit();
  };

  return (
    <>
      <div className={styles.bar}>
        <span className={styles.label}>完成进度:</span>

        <div className={styles.progressWrap}>
          <div className={styles.progressTrack}>
<div
  className={`${styles.progressFill} ${
    progress === 100 ? styles.completed : ""
  }`}
  style={{ width: `${progress}%` }}
/>

          </div>

          <span className={styles.count}>
            {finished} / {total}
          </span>

          {/* ✏️ Manual Edit Button */}
            <button
            className={styles.manualBtn}
            onClick={handleManualClick}
            >
            编辑排表
            </button>
        </div>
      </div>

      {confirmOpen && (
        <ConfirmModal
        intent = "warning"
          title="确认手动编辑"
          message="当前排表已锁定，确定要手动编辑吗？"
          confirmText="继续编辑"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}
