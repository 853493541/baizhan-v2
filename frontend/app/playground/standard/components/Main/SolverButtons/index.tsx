import styles from "./styles.module.css";

interface Props {
  solving: boolean;
  disabled?: boolean; // ✅ external lock flag
  onCore: () => void;
  onFull: () => void;
}

export default function SolverButtons({ solving, disabled, onCore, onFull }: Props) {
  const isLocked = solving || disabled;

  return (
    <div className={styles.solverButtons}>
      <button
        className={`${styles.solverBtn} ${styles.coreBtn} ${isLocked ? styles.locked : ""}`}
        onClick={onCore}
        disabled={isLocked}
      >
        {isLocked ? "🔒 " : ""}
        {solving ? "处理中..." : "简易排表 (核心技能)"}
      </button>

      <button
        className={`${styles.solverBtn} ${styles.fullBtn} ${isLocked ? styles.locked : ""}`}
        onClick={onFull}
        disabled={isLocked}
      >
        {isLocked ? "🔒 " : ""}
        {solving ? "排表中..." : "一键排表"}
      </button>
    </div>
  );
}
