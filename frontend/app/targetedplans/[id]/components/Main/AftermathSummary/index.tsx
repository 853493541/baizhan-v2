import styles from "./styles.module.css";

interface Props {
  wasted9: number;
  wasted10: number;
}

export default function AftermathSummary({ wasted9, wasted10 }: Props) {
  return (
    <div className={styles.aftermath}>
      <p>9重技能浪费: {wasted9}</p>
      <p>10重技能最多浪费 {wasted10}</p>
    </div>
  );
}
