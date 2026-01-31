"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import type { GameEvent } from "@/app/game/in-game/types";

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
  const [current, setCurrent] = useState<GameEvent | null>(null);

  useEffect(() => {
    if (!Array.isArray(events)) {
      setCurrent(null);
      return;
    }

    // ✅ find latest PLAY_CARD only
    const lastPlay = [...events]
      .reverse()
      .find((e) => e.type === "PLAY_CARD");

    setCurrent(lastPlay ?? null);
  }, [events]);

  if (!current) return null;

  const isMe = current.actorUserId === myUserId;
  const actor = isMe ? "你" : "对手";

  return (
    <div className={styles.wrap}>
      <span className={styles.turn}>
        T{current.turn}
      </span>
      <span className={styles.text}>
        {actor} 使用了【{current.cardName ?? current.cardId}】
      </span>
    </div>
  );
}
