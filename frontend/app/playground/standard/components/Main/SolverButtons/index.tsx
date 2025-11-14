import styles from "./styles.module.css";

interface Props {
  solving: boolean;
  disabled?: boolean;       // 🔒 external lock
  onCore: () => void;
  onFull: () => void;
  onManual: () => void;     // ⭐ NEW prop
}

export default function SolverButtons({
  solving,
  disabled,
  onCore,
  onFull,
  onManual,
}: Props) {
  const isLocked = disabled ?? false;

  // helper to decide button text
  const getLabel = (type: "core" | "full") => {
    if (solving && isLocked) return type === "core" ? "🔒 处理中" : "🔒 排表中";
    if (solving) return type === "core" ? "🔒处理中..." : "🔒排表中";
    if (isLocked) return "🔒 已锁定";
    return type === "core" ? "自定义排表" : "全局排表";
  };

  return (
    <div className={styles.solverButtons}>
      {/* 自定义排表 */}
      <button
        className={`${styles.solverBtn} ${styles.coreBtn} ${
          isLocked ? styles.locked : ""
        }`}
        onClick={onCore}
        disabled={solving || isLocked}
      >
        {getLabel("core")}
      </button>

      {/* 全局排表 */}
      <button
        className={`${styles.solverBtn} ${styles.fullBtn} ${
          isLocked ? styles.locked : ""
        }`}
        onClick={onFull}
        disabled={solving || isLocked}
      >
        {getLabel("full")}
      </button>

      {/* ⭐ NEW: 手动编辑 — same size, same style */}
      <button
        className={`${styles.solverBtn} ${styles.fullBtn} ${
          isLocked ? styles.locked : ""
        }`}
        onClick={onManual}
        disabled={isLocked}
      >
        手动编辑
      </button>
    </div>
  );
}
