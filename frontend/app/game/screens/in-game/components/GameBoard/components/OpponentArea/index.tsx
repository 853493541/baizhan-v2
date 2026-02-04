"use client";

import HealthBar from "../HealthBar";
import StatusBar from "../StatusBar";
import styles from "./styles.module.css";
import type { PlayerState } from "@/app/game/screens/in-game/types";

const MAX_HP = 100;

type Props = {
  opponent: PlayerState;
  currentTurn: number;
};

export default function OpponentArea({ opponent, currentTurn }: Props) {
  return (
    <div className={styles.enemyHalf} data-label="OpponentArea">
      {/* 🟩 Enemy Health */}
      <div className={styles.section} data-label="Enemy Health">
        <HealthBar
          hp={opponent.hp}
          maxHp={MAX_HP}
          side="enemy"
        />
      </div>

      {/* 🟩 Enemy Buffs / Debuffs */}
      <div className={styles.section} data-label="Enemy Status">
        <StatusBar
          buffs={opponent.buffs}
          currentTurn={currentTurn}
        />
      </div>

      {/* 🟩 Enemy Hand Count */}
      <div className={styles.section} data-label="Enemy Hand">
        <div className={styles.opponentHand}>
          <div className={styles.cardBack}>
            <span className={styles.cardCount}>
              {opponent.hand.length}
            </span>
          </div>
          {/* <div className={styles.handLabel}>对手手牌</div> */}
        </div>
      </div>
    </div>
  );
}
