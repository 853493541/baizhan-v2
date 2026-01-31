"use client";

import AnimatedHandSlot from "./AnimatedHandSlot";
import Card from "../card";
import styles from "./styles.module.css";

import type { CardInstance } from "@/app/game/in-game/types";

type Props = {
  cards: CardInstance[];
  onPlayCard: (card: CardInstance) => void;
};

export default function Hand({ cards, onPlayCard }: Props) {
  return (
    <div className={styles.hand}>
      {cards.map((card) => (
        <AnimatedHandSlot key={card.instanceId}>
          <Card
            cardId={card.cardId}
            variant="hand"
            onClick={() => onPlayCard(card)}
          />
        </AnimatedHandSlot>
      ))}
    </div>
  );
}
