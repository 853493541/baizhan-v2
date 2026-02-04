"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import type { GameEvent } from "@/app/game/screens/in-game/types";
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

  /* ================= DEVICE DETECTION ================= */

  const isPhone =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 768px)").matches;

  /* ================= UPDATE LOGIC ================= */

  useEffect(() => {
    if (!Array.isArray(events)) return;

    const last = events
      .filter((e) => e.type === "PLAY_CARD")
      .at(-1);

    if (!last) return;

    setCards((prev) => {
      if (prev[0]?.id === last.id) return prev;

      // desktop keeps 4, phone keeps only 1
      const limit = isPhone ? 1 : 3;
      return [last, ...prev].slice(0, limit);
    });
  }, [events, isPhone]);

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
              !isPhone && idx === 2 && styles.fadeOut,
            ]
              .filter(Boolean)
              .join(" ")}
            style={{
              transform: isPhone
                ? "translateY(0)"
                : `translateX(calc(-1 * ${idx} * var(--card-shift)))`,
            }}
          >
            <Card cardId={e.cardId} variant="arena" />
          </div>
        );
      })}
    </div>
  );
}
