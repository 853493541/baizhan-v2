import styles from "./styles.module.css";

interface Props {
  solving: boolean;
  onCore: () => void;
  onFull: () => void;
}

export default function SolverButtons({ solving, onCore, onFull }: Props) {
  return (
    <div className={styles.solverButtons}>
      <button className={`${styles.solverBtn} ${styles.coreBtn}`} onClick={onCore} disabled={solving}>
        {solving ? "处理中..." : "高级排表 (核心技能)"}
      </button>
      <button className={`${styles.solverBtn} ${styles.fullBtn}`} onClick={onFull} disabled={solving}>
        {solving ? "处理中..." : "高级排表 (全部技能)"}
      </button>
    </div>
  );
}
