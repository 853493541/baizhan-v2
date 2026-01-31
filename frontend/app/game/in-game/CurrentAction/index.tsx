"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.css";

/* ✅ Shared type */
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
    // ✅ HARD GUARD — prevents runtime crash
    if (!Array.isArray(events) || events.length === 0) {
      setCurrent(null);
      return;
    }

    // latest event only
    const last = events[events.length - 1];
    setCurrent(last);
  }, [events]);

  if (!current) return null;

  const isMe = current.actorUserId === myUserId;
  const actor = isMe ? "你" : "对手";
  const target =
    current.targetUserId === myUserId ? "你" : "对手";

  let text = "";

  switch (current.type) {
    case "PLAY_CARD":
      text = `${actor}使用了【${current.cardName ?? current.cardId}】`;
      break;

    case "DAMAGE":
      text = `${target}受到 ${current.value} 点伤害`;
      break;

    case "HEAL":
      text = `${target}回复 ${current.value} 点生命`;
      break;

    case "STATUS_APPLIED":
      text = `${target}获得【${current.statusType}】`;
      break;

    case "END_TURN":
      text = `${actor}结束了回合`;
      break;
  }

  return (
    <div className={styles.wrap}>
      <span className={styles.turn}>T{current.turn}</span>
      <span className={styles.text}>{text}</span>
    </div>
  );
}
