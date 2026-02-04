"use client";

import AnimatedHandSlot from "./AnimatedHandSlot";
import Card from "../../card";
import styles from "./styles.module.css";

import type { CardInstance } from "@/app/game/screens/in-game/types";

type Props = {
  cards: CardInstance[];
  onPlayCard: (card: CardInstance) => void;
  isMyTurn: boolean;
};

export default function Hand({ cards, onPlayCard, isMyTurn }: Props) {
  return (
    <div className={styles.hand}>
      {cards.map((card) => (
        <AnimatedHandSlot key={card.instanceId}>
          <Card
            cardId={card.cardId}
            variant={isMyTurn ? "hand" : "disabled"}
            onClick={isMyTurn ? () => onPlayCard(card) : undefined}
          />
        </AnimatedHandSlot>
      ))}
    </div>
  );
}
