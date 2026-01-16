"use client";

import { useRef, useState } from "react";
import styles from "./styles.module.css";
import ConfirmModal from "@/app/components/ConfirmModal";

/* =========================
   Types
========================= */
interface CacheSlot {
  id: number;
}

interface Props {
  finished: number;
  total: number;
  locked: boolean;
  onManualEdit: () => void;

  // 🗂 temp cache controls
  cache: CacheSlot[];
  onSaveCache: () => void;
  onRestoreCache: (idx: number) => void;
}

export default function ControlBar({
  finished,
  total,
  locked,
  onManualEdit,
  cache,
  onSaveCache,
  onRestoreCache,
}: Props) {
  const progress =
    total === 0 ? 0 : Math.round((finished / total) * 100);

  /* =========================
     Manual edit confirm
  ========================= */
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

  /* =========================
     Render
  ========================= */
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

          {/* ✏️ Manual Edit */}
          <button
            className={styles.manualBtn}
            onClick={handleManualClick}
          >
            编辑排表
          </button>

          {/* =========================
             🗂 Temp Cache Controls
          ========================= */}
          <div className={styles.cacheBar}>
            <button
              className={styles.cacheSaveBtn}
              onClick={onSaveCache}
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
                    disabled={!hasCache}
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
      </div>

      {/* =========================
         Confirm modal
      ========================= */}
      {confirmOpen && (
        <ConfirmModal
          intent="warning"
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
