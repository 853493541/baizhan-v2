"use client";

import styles from "./styles.module.css";

type Props = {
  isMyTurn: boolean;
  onEndTurn: () => void;
};

export default function EndTurn({ isMyTurn, onEndTurn }: Props) {
  return (
    <button
      className={styles.endTurnBtn}
      disabled={!isMyTurn}
      onClick={onEndTurn}
    >
      {isMyTurn ? "结束回合" : "等待中"}
    </button>
  );
}
