"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./styles.module.css";
import type { GameEvent } from "@/app/game/in-game/types";

/* ================= PROPS ================= */

type Props = {
  events: GameEvent[] | undefined | null;
  myUserId: string;
};

/* ================= HELPERS ================= */

function getCardIcon(cardName?: string, cardId?: string) {
  const file = cardName ?? cardId;
  if (!file) return "";
  return `/game/icons/Skills/${file}.png`;
}

/* ================= COMPONENT ================= */

export default function ActionHistory({ events, myUserId }: Props) {
  // ✅ ONLY card usage, newest first, max 10
  const playEvents = useMemo(() => {
    if (!Array.isArray(events)) return [];
    return events
      .filter((e) => e.type === "PLAY_CARD")
      .slice()
      .reverse()
      .slice(0, 10);
  }, [events]);

  // ✅ fixed 10-slot layout: fill rest with empties
  const emptyCount = Math.max(0, 10 - playEvents.length);

  // ✅ animation trigger when newest event changes
  const prevTopIdRef = useRef<string | null>(null);
  const [animateKey, setAnimateKey] = useState(0);

  useEffect(() => {
    const topId = playEvents[0]?.id ?? null;

    // first render: just set baseline (no animation spam)
    if (prevTopIdRef.current === null) {
      prevTopIdRef.current = topId;
      return;
    }

    // new event arrived at top
    if (topId && topId !== prevTopIdRef.current) {
      prevTopIdRef.current = topId;
      setAnimateKey((k) => k + 1);
    }
  }, [playEvents]);

  return (
    <div className={styles.wrap} key={animateKey}>
      {playEvents.map((e, idx) => {
        const isMe = e.actorUserId === myUserId;
        const icon = getCardIcon(e.cardName, e.cardId);

        // newest item slides in, older ones "push down"
        const animClass =
          animateKey > 0
            ? idx === 0
              ? styles.newItem
              : styles.shiftDown
            : "";

        return (
          <div
            key={e.id}
            className={`${styles.row} ${isMe ? styles.me : styles.enemy} ${animClass}`}
          >
            {icon && (
              <img
                src={icon}
                className={styles.icon}
                draggable={false}
                alt=""
              />
            )}
          </div>
        );
      })}

      {/* fill to 10 slots (no scroll, fixed space) */}
      {Array.from({ length: emptyCount }).map((_, i) => (
        <div key={`empty-${i}`} className={styles.emptyRow} />
      ))}
    </div>
  );
}
