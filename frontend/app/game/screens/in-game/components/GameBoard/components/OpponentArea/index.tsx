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

export default function OpponentArea({
  opponent,
  currentTurn,
}: Props) {
  return (
    <div className={styles.enemyHalf} data-label="OpponentArea">
      {/* ================= ENEMY HEALTH + GCD ================= */}
      <div className={styles.section} data-label="Enemy Health">
        <HealthBar
          hp={opponent.hp}
          maxHp={MAX_HP}
          side="enemy"
          gcd={opponent.gcd}
        />
      </div>

      {/* ================= ENEMY BUFFS / DEBUFFS ================= */}
      <div className={styles.section} data-label="Enemy Status">
        <StatusBar
          buffs={opponent.buffs}
          currentTurn={currentTurn}
        />
      </div>

      {/* ================= ENEMY HAND COUNT ================= */}
      <div className={styles.section} data-label="Enemy Hand">
        <div className={styles.opponentHand}>
          <div className={styles.cardBack}>
            <span className={styles.cardCount}>
              {opponent.hand.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
