import styles from "./styles.module.css";

export default function BossCardNeeds({ needs }: { needs: any[] }) {
  if (!needs || needs.length === 0) {
    return <p className={styles.noNeed}>无需求</p>;
  }

  return (
    <ul className={styles.needList}>
      {needs.map((n) => (
        <li
          key={n.ability}
          className={n.isHighlight ? styles.coreHighlight : ""}
        >
          {n.ability} ({n.needCount})
        </li>
      ))}
    </ul>
  );
}
