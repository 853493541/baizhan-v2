"use client";

import styles from "./styles.module.css";

/* ✅ USE SHARED FRONTEND TYPES */
import type { GameEvent } from "../types";

/* ================= PROPS ================= */

type Props = {
  events: GameEvent[];
  myUserId: string;
};

/* ================= HELPERS ================= */

function renderLine(e: GameEvent, myUserId: string) {
  const isMe = e.actorUserId === myUserId;
  const actor = isMe ? "你" : "对手";
  const target =
    e.targetUserId === myUserId ? "你" : "对手";

  switch (e.type) {
    case "PLAY_CARD":
      return `${actor}使用了【${e.cardName ?? e.cardId}】`;

    case "DAMAGE":
      return `${target}受到 ${e.value} 点伤害`;

    case "HEAL":
      return `${target}回复 ${e.value} 点生命`;

    case "STATUS_APPLIED":
      return `${target}获得【${e.statusType}】`;

    case "END_TURN":
      return `${actor}结束了回合`;

    default:
      return "";
  }
}

/* ================= COMPONENT ================= */

export default function ActionHistory({
  events,
  myUserId,
}: Props) {
  if (!events || events.length === 0) {
    return (
      <div className={styles.empty}>
        暂无战斗记录
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {events.map((e) => (
        <div key={e.id} className={styles.line}>
          <span className={styles.turn}>
            T{e.turn}
          </span>
          <span className={styles.text}>
            {renderLine(e, myUserId)}
          </span>
        </div>
      ))}
    </div>
  );
}
