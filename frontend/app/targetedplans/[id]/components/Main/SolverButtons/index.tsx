import styles from "./styles.module.css";

interface Props {
  solving: boolean;
  disabled?: boolean; // ✅ external lock flag
  onCore: () => void;
  onFull: () => void;
}

export default function SolverButtons({ solving, disabled, onCore, onFull }: Props) {
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
      <button
        className={`${styles.solverBtn} ${styles.coreBtn} ${isLocked ? styles.locked : ""}`}
        onClick={onCore}
        disabled={solving || isLocked}
      >
        {getLabel("core")}
      </button>

      <button
        className={`${styles.solverBtn} ${styles.fullBtn} ${isLocked ? styles.locked : ""}`}
        onClick={onFull}
        disabled={solving || isLocked}
      >
        {getLabel("full")}
      </button>
    </div>
  );
}
