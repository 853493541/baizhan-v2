"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import type { GameEvent } from "@/app/game/in-game/types";
import Card from "../card";

/* ================= PROPS ================= */

type Props = {
  events: GameEvent[] | undefined | null;
  myUserId: string;
};

/* ================= COMPONENT ================= */

export default function CurrentAction({
  events,
  myUserId,
}: Props) {
  const [cards, setCards] = useState<GameEvent[]>([]);

  /* ================= UPDATE LOGIC ================= */

  useEffect(() => {
    if (!Array.isArray(events)) return;

    const last = events
      .filter((e) => e.type === "PLAY_CARD")
      .at(-1);

    if (!last) return;

    setCards((prev) => {
      if (prev[0]?.id === last.id) return prev;
      return [last, ...prev].slice(0, 4);
    });
  }, [events]);

  /* ================= RENDER ================= */

  return (
    <div className={styles.arena}>
      {cards.map((e, idx) => {
        const isMe = e.actorUserId === myUserId;

        return (
          <div
            key={e.id}
            className={[
              styles.cardWrap,
              isMe ? styles.me : styles.enemy,
              idx === 0 &&
                (isMe
                  ? styles.enterFromBottom
                  : styles.enterFromTop),
              idx === 3 && styles.fadeOut,
            ]
              .filter(Boolean)
              .join(" ")}
            style={{
              transform: `translateX(calc(-1 * ${idx} * var(--card-shift)))`,
            }}
          >
            <Card cardId={e.cardId} variant="arena" />
          </div>
        );
      })}
    </div>
  );
}
