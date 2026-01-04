import styles from "./styles.module.css";

/* 🧬 Mutated Boss（异类） */
const mutatedBosses = new Set(["肖红", "青年程沐华", "困境韦柔丝"]);
const grayMutationBosses = new Set(["程沐华", "韦柔丝", "肖童"]);
const redHeaderBosses = new Set(["青年程沐华", "困境韦柔丝", "肖红"]);

export default function BossCardHeader({
  floor,
  boss,
  kill,
  onChangeBoss,
  onToggleMutation,
  onAddSecondaryDrop,
}: any) {
  const isMutatedBoss = mutatedBosses.has(boss);
  const isGrayMutation = grayMutationBosses.has(boss);
  const hasKillRecord = !!kill;
  const isRedHeader = redHeaderBosses.has(boss) && !hasKillRecord;
  const hideFloorInHeader = floor === 100 && boss === "青年谢云流";

  return (
    <>
      {(isMutatedBoss || onToggleMutation) && (
        <button
          className={`${styles.mutatedBossBadge} ${
            isGrayMutation ? styles.mutatedBossBadgeGray : ""
          }`}
          title="异"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMutation?.(floor);
          }}
        >
          异
        </button>
      )}

      {(floor === 90 || floor === 100) && onChangeBoss && (
        <button
          className={styles.changeBtn}
          title="更换首领"
          onClick={(e) => {
            e.stopPropagation();
            onChangeBoss(floor);
          }}
        >
          换
        </button>
      )}

      {onAddSecondaryDrop && (
        <button
          className={styles.addSecondaryBtn}
          title="添加第二掉落"
          onClick={(e) => {
            e.stopPropagation();
            onAddSecondaryDrop(floor);
          }}
        >
          +
        </button>
      )}

      <div
        className={`${styles.header} ${
          isRedHeader ? styles.headerRed : ""
        }`}
      >
        {hideFloorInHeader ? boss : `${floor} ${boss}`}
      </div>
    </>
  );
}
