"use client";

import HealthBar from "../HealthBar";
import StatusBar from "../StatusBar";
import Hand from "./Hand";
import styles from "./styles.module.css";

import type {
  PlayerState,
  CardInstance,
} from "@/app/game/screens/in-game/types";

const MAX_HP = 100;

type Props = {
  me: PlayerState;
  currentTurn: number;
  isMyTurn: boolean;
  onPlayCard: (card: CardInstance) => void;
};

export default function PlayerArea({
  me,
  currentTurn,
  isMyTurn,
  onPlayCard,
}: Props) {
  return (
    <div className={styles.playerHalf}>
      {/* ================= STATUS / BUFFS ================= */}
      <StatusBar
        buffs={me.buffs}
        currentTurn={currentTurn}
      />

      {/* ================= HP + GCD ================= */}
      <HealthBar
        hp={me.hp}
        maxHp={MAX_HP}
        side="player"
        gcd={me.gcd}
      />

      {/* ================= HAND ================= */}
      <div className={styles.handZone}>
        <Hand
          cards={me.hand}
          onPlayCard={onPlayCard}
          isMyTurn={isMyTurn}
        />
      </div>
    </div>
  );
}
