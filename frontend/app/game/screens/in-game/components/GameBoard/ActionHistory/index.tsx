"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./styles.module.css";
import type { GameEvent } from "@/app/game/screens/in-game/types";
import Card from "../../card";

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
  const [hovered, setHovered] = useState<{
    event: GameEvent;
    index: number;
  } | null>(null);

  /* ================= EVENTS ================= */

  const playEvents = useMemo(() => {
    if (!Array.isArray(events)) return [];
    return events
      .filter((e) => e.type === "PLAY_CARD")
      .slice()
      .reverse()
      .slice(0, 10);
  }, [events]);

  const emptyCount = Math.max(0, 10 - playEvents.length);

  /* ================= ANIMATION ================= */

  const prevTopIdRef = useRef<string | null>(null);
  const [animateKey, setAnimateKey] = useState(0);

  useEffect(() => {
    const topId = playEvents[0]?.id ?? null;

    if (prevTopIdRef.current === null) {
      prevTopIdRef.current = topId;
      return;
    }

    if (topId && topId !== prevTopIdRef.current) {
      prevTopIdRef.current = topId;
      setAnimateKey((k) => k + 1);
    }
  }, [playEvents]);

  /* ================= RENDER ================= */

  return (
    <div className={styles.historyContainer}>
      <div className={styles.wrap} key={animateKey}>
        {playEvents.map((e, idx) => {
          const isMe = e.actorUserId === myUserId;
          const icon = getCardIcon(e.cardName, e.cardId);

          const animClass =
            animateKey > 0
              ? idx === 0
                ? styles.newItem
                : styles.shiftDown
              : "";

          return (
            <div
              key={e.id}
              className={`${styles.row} ${
                isMe ? styles.me : styles.enemy
              } ${animClass}`}
              onMouseEnter={() => setHovered({ event: e, index: idx })}
              onMouseLeave={() => setHovered(null)}
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

        {/* fill empty slots */}
        {Array.from({ length: emptyCount }).map((_, i) => (
          <div key={`empty-${i}`} className={styles.emptyRow} />
        ))}
      </div>

      {/* ================= HOVER PREVIEW ================= */}
      {hovered?.event.cardId && (
        <div
          className={styles.preview}
          style={{
            top: 8 + hovered.index * 46, // row height + gap
          }}
        >
          <Card
            cardId={hovered.event.cardId}
            variant="preview"
          />
        </div>
      )}
    </div>
  );
}
