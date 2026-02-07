"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./styles.module.css";
import type { GameEvent } from "@/app/game/screens/in-game/types";
import Card from "../../../Card";

/* ================= PROPS ================= */

type Props = {
  events: GameEvent[] | undefined | null;
  myUserId: string;
};

/* ================= TOKEN COMPONENTS ================= */

const Skill = ({ name }: { name: string }) => (
  <span className={styles.skill}>[{name}]</span>
);

const Buff = ({ name }: { name: string }) => (
  <span className={styles.buff}>[{name}]</span>
);

const Target = ({ name }: { name: string }) => (
  <span className={styles.target}>[{name}]</span>
);

const DamageNum = ({ value }: { value: number }) => (
  <span className={styles.number}>{value}</span>
);

/* ================= HELPERS ================= */

function getCardIcon(cardName?: string, cardId?: string) {
  const file = cardName ?? cardId;
  if (!file) return "";
  return `/game/icons/Skills/${file}.png`;
}

/* ================= RENDERERS ================= */

function renderDamageLine(e: GameEvent, myUserId: string) {
  const isMe = e.actorUserId === myUserId;
  const dmg = e.value ?? 0;

  if (isMe) {
    // 你的[江海凝光]对[小混混]造成了252点阴性内功伤害。
    return (
      <>
        你的<Skill name={e.cardName!} />
        对<Target name={e.targetName ?? "敌人"} />
        造成了<DamageNum value={dmg} />点伤害。
      </>
    );
  }

  // [小混混]的[攻击]对你造成了439点外功伤害。
  return (
    <>
      <Target name={e.actorName ?? "对手"} />
      的<Skill name={e.cardName!} />
      对你造成了<DamageNum value={dmg} />点伤害。
    </>
  );
}

function renderBuffLine(e: GameEvent, myUserId: string) {
  const isMe = e.targetUserId === myUserId;

  // 你获得了效果[弹跳]。
  if (e.type === "BUFF_APPLIED") {
    return (
      <>
        {isMe ? "你" : "对手"}获得了效果
        <Buff name={e.buffName!} />。
      </>
    );
  }

  // [弹跳]效果从你身上消失了。
  if (e.type === "BUFF_EXPIRED") {
    return (
      <>
        <Buff name={e.buffName!} />
        效果从{isMe ? "你" : "对手"}身上消失了。
      </>
    );
  }

  return null;
}

/* ================= COMPONENT ================= */

export default function ActionHistory({ events, myUserId }: Props) {
  const [hovered, setHovered] = useState<{
    event: GameEvent;
    index: number;
  } | null>(null);

  const [tab, setTab] = useState<"damage" | "buff">("damage");

  /* ================= EVENTS ================= */

  const playEvents = useMemo(() => {
    if (!Array.isArray(events)) return [];
    return events
      .filter((e) => e.type === "PLAY_CARD")
      .slice()
      .reverse()
      .slice(0, 10);
  }, [events]);

  const damageEvents = useMemo(() => {
    if (!Array.isArray(events)) return [];
    return events
      .filter((e) => e.type === "DAMAGE" && e.cardName)
      .slice()
      .reverse()
      .slice(0, 8);
  }, [events]);

  const buffEvents = useMemo(() => {
    if (!Array.isArray(events)) return [];
    return events
      .filter(
        (e) =>
          (e.type === "BUFF_APPLIED" || e.type === "BUFF_EXPIRED") &&
          e.buffName
      )
      .slice()
      .reverse()
      .slice(0, 8);
  }, [events]);

  const emptyCount = Math.max(0, 10 - playEvents.length);

  /* ================= ANIMATION ================= */

  const prevTopIdRef = useRef<string | null>(null);
  const [animateKey, setAnimateKey] = useState(0);

  useEffect(() => {
    const topId = playEvents[0]?.id ?? null;
    if (prevTopIdRef.current && topId !== prevTopIdRef.current) {
      setAnimateKey((k) => k + 1);
    }
    prevTopIdRef.current = topId;
  }, [playEvents]);

  /* ================= RENDER ================= */

  return (
    <div className={styles.container}>
      {/* ================= HISTORY BAR ================= */}
      <div className={styles.historyContainer}>
        <div className={styles.wrap} key={animateKey}>
          {playEvents.map((e, idx) => {
            const isMe = e.actorUserId === myUserId;
            const icon = getCardIcon(e.cardName, e.cardId);

            return (
              <div
                key={e.id}
                className={`${styles.row} ${
                  isMe ? styles.me : styles.enemy
                }`}
                onMouseEnter={() => setHovered({ event: e, index: idx })}
                onMouseLeave={() => setHovered(null)}
              >
                {icon && <img src={icon} className={styles.icon} alt="" />}
              </div>
            );
          })}

          {Array.from({ length: emptyCount }).map((_, i) => (
            <div key={`empty-${i}`} className={styles.emptyRow} />
          ))}
        </div>

        {hovered?.event.cardId && (
          <div
            className={styles.preview}
            style={{ top: 8 + hovered.index * 46 }}
          >
            <Card cardId={hovered.event.cardId} variant="preview" />
          </div>
        )}
      </div>

      {/* ================= RIGHT PANEL ================= */}
      <div className={styles.panel}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              tab === "damage" ? styles.activeTab : ""
            }`}
            onClick={() => setTab("damage")}
          >
            伤害
          </button>
          <button
            className={`${styles.tab} ${
              tab === "buff" ? styles.activeTab : ""
            }`}
            onClick={() => setTab("buff")}
          >
            状态
          </button>
        </div>

        <div className={styles.panelBody}>
          {tab === "damage" &&
            (damageEvents.length === 0 ? (
              <div className={styles.emptyText}>暂无伤害记录</div>
            ) : (
              damageEvents.map((e) => (
                <div key={e.id} className={styles.logLine}>
                  {renderDamageLine(e, myUserId)}
                </div>
              ))
            ))}

          {tab === "buff" &&
            (buffEvents.length === 0 ? (
              <div className={styles.emptyText}>暂无状态变化</div>
            ) : (
              buffEvents.map((e) => (
                <div key={e.id} className={styles.logLine}>
                  {renderBuffLine(e, myUserId)}
                </div>
              ))
            ))}
        </div>
      </div>
    </div>
  );
}
