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
    return (
      <>
        你的<Skill name={e.cardName!} />
        对<Target name={e.targetName ?? "敌人"} />
        造成了<DamageNum value={dmg} />点伤害。
      </>
    );
  }

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

  if (e.type === "BUFF_APPLIED") {
    return (
      <>
        {isMe ? "你" : "对手"}获得了效果
        <Buff name={e.buffName!} />。
      </>
    );
  }

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
  const [tab, setTab] = useState<"damage" | "buff">("damage");
  const [hovered, setHovered] = useState<GameEvent | null>(null);

  const logBodyRef = useRef<HTMLDivElement | null>(null);

  /* ================= EVENTS ================= */

  // last 7 plays, oldest -> newest (newest appears on RIGHT)
  const playEvents = useMemo(() => {
    if (!Array.isArray(events)) return [];
    return events.filter((e) => e.type === "PLAY_CARD").slice(-7);
  }, [events]);

  const damageEvents = useMemo(() => {
    if (!Array.isArray(events)) return [];
    return events.filter((e) => e.type === "DAMAGE" && e.cardName).slice(-30);
  }, [events]);

  const buffEvents = useMemo(() => {
    if (!Array.isArray(events)) return [];
    return events
      .filter(
        (e) =>
          (e.type === "BUFF_APPLIED" || e.type === "BUFF_EXPIRED") && e.buffName
      )
      .slice(-30);
  }, [events]);

  /* ================= AUTO SCROLL ================= */

  useEffect(() => {
    const el = logBodyRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [damageEvents, buffEvents, tab]);

  /* ================= ANIMATION TRIGGER (RESTORED) =================
     We remount the abilityBar on a new PLAY_CARD so CSS animations replay.
     NEWEST icon should slide in from RIGHT, others "shift left" into place.
  ================================================================ */

  const prevNewestPlayIdRef = useRef<string | null>(null);
  const [animateKey, setAnimateKey] = useState(0);

  useEffect(() => {
    const newestId = playEvents[playEvents.length - 1]?.id ?? null;
    if (prevNewestPlayIdRef.current && newestId !== prevNewestPlayIdRef.current) {
      setAnimateKey((k) => k + 1);
    }
    prevNewestPlayIdRef.current = newestId;
  }, [playEvents]);

  /* ================= RENDER ================= */

  return (
    <div className={styles.wrapper}>
      <div className={styles.chatlog}>
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

        <div className={styles.logBody} ref={logBodyRef}>
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

        {/* ability bar remounts to replay animations */}
        <div className={styles.abilityBar} key={animateKey}>
          {playEvents.map((e, idx) => {
            const icon = getCardIcon(e.cardName, e.cardId);
            const isMe = e.actorUserId === myUserId;

            const isNewest = idx === playEvents.length - 1;

            return (
              <div
                key={e.id}
                className={[
                  styles.abilityIcon,
                  isMe ? styles.me : styles.enemy,
                  isNewest ? styles.newestIcon : styles.shiftIcon,
                ]
                  .filter(Boolean)
                  .join(" ")}
                onMouseEnter={() => setHovered(e)}
                onMouseLeave={() => setHovered(null)}
              >
                {icon && <img src={icon} alt="" draggable={false} />}
              </div>
            );
          })}
        </div>
      </div>

      {hovered?.cardId && (
        <div className={styles.preview}>
          <Card cardId={hovered.cardId} variant="preview" />
        </div>
      )}
    </div>
  );
}
