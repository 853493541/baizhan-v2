import { useRef } from "react";
import styles from "./styles.module.css";

interface Props {
  solving: boolean;
  disabled?: boolean;
  onCore: () => void;
  onFull: () => void;
  onManual: () => void;
}

export default function SolverButtons({
  solving,
  disabled,
  onCore,
  onFull,
  onManual,
}: Props) {
  const isLocked = disabled ?? false;

  // ⭐ NEW: tracks if user already confirmed in this session
  const manualWarnedRef = useRef(false);

  const handleManualClick = () => {
    // If NOT locked, open immediately
    if (!isLocked) {
      onManual();
      return;
    }

    // If locked, but user already confirmed once → open without asking
    if (manualWarnedRef.current) {
      onManual();
      return;
    }

    // First time showing warning
    const ok = window.confirm("当前排表已锁定，确定要手动编辑吗？");
    if (ok) {
      manualWarnedRef.current = true; // ✔ Remember user's choice
      onManual();
    }
  };

  return (
    <div className={styles.solverButtons}>

      {/* Custom Solver — hidden when locked */}
      {!isLocked && (
        <button
          className={`${styles.solverBtn} ${styles.coreBtn}`}
          onClick={onCore}
          disabled={solving}
        >
          {solving ? "处理中..." : "自定义排表"}
        </button>
      )}

      {/* Full Solver / Locked indicator */}
      <button
        className={`${styles.solverBtn} ${styles.fullBtn} ${
          isLocked ? styles.disabledLight : ""
        }`}
        onClick={() => !isLocked && onFull()}
        disabled={solving || isLocked}
      >
        {isLocked ? "🔒 已锁定" : solving ? "排表中..." : "全局排表"}
      </button>

      {/* Manual Edit — always visible, ask ONCE */}
      <button
        className={`${styles.solverBtn} ${styles.manualBtn}`}
        onClick={handleManualClick}
      >
        手动编辑
      </button>
    </div>
  );
}
