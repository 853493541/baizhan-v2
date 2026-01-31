"use client";

import { useEffect, useRef, useState } from "react";
import "./game-board.css";
import Card from "./card";
import StatusBar from "./statusBar";

import CurrentAction from "./CurrentAction";
import ActionHistory from "./ActionHistory";

/* ✅ USE SHARED TYPES — NO LOCAL DUPLICATES */
import type {
  CardInstance,
  PlayerState,
  GameEvent,
} from "@/app/game/in-game/types";

/* ================= PROPS ================= */

type Props = {
  me: PlayerState;
  opponent: PlayerState;

  /** ✅ MUST be the shared GameEvent[] */
  events: GameEvent[];

  isMyTurn: boolean;
  onPlayCard: (card: CardInstance) => void;
  onEndTurn: () => void;
  currentTurn: number;
};

const MAX_HP = 100;

/* ================= COMPONENT ================= */

export default function GameBoard({
  me,
  opponent,
  events,
  isMyTurn,
  onPlayCard,
  onEndTurn,
  currentTurn,
}: Props) {
  const prevMyHp = useRef(me.hp);
  const prevEnemyHp = useRef(opponent.hp);

  const [myDelta, setMyDelta] = useState<number | null>(null);
  const [enemyDelta, setEnemyDelta] = useState<number | null>(null);

  /* ================= HP CHANGE ANIMATION ================= */

  useEffect(() => {
    const diff = me.hp - prevMyHp.current;
    if (diff !== 0) {
      setMyDelta(diff);
      setTimeout(() => setMyDelta(null), 800);
      prevMyHp.current = me.hp;
    }
  }, [me.hp]);

  useEffect(() => {
    const diff = opponent.hp - prevEnemyHp.current;
    if (diff !== 0) {
      setEnemyDelta(diff);
      setTimeout(() => setEnemyDelta(null), 800);
      prevEnemyHp.current = opponent.hp;
    }
  }, [opponent.hp]);

  return (
    <div className="board-root">
      <div className="board">

        {/* ================= ENEMY HALF ================= */}
        <div className="half enemy-half">
          <div className="hp-bar enemy">
            <span className="hp-icon">❤️</span>
            <div className="hp-track">
              <div
                className="hp-fill"
                style={{ width: `${(opponent.hp / MAX_HP) * 100}%` }}
              />
            </div>
            <span className="hp-text">{opponent.hp}</span>

            {enemyDelta !== null && (
              <span
                className={`hp-delta ${
                  enemyDelta > 0 ? "heal" : "damage"
                }`}
              >
                {enemyDelta > 0 ? `+${enemyDelta}` : enemyDelta}
              </span>
            )}
          </div>

          <StatusBar
            statuses={opponent.statuses}
            currentTurn={currentTurn}
          />

          {/* ===== Opponent hand count ===== */}
          <div className="opponent-hand">
            <div className="card-back">
              <span className="card-count">
                {opponent.hand.length}
              </span>
            </div>
            <div className="opponent-hand-label">
              对手手牌
            </div>
          </div>
        </div>

        {/* ================= CURRENT ACTION ================= */}
        <CurrentAction
          events={events}
          myUserId={me.userId}
        />

        {/* ================= TURN BAR ================= */}
        <div className="turn-bar">
          <span className="turn-text">
            {isMyTurn ? "你的回合" : "对手回合"}
          </span>

          <button
            className="end-turn-btn"
            disabled={!isMyTurn}
            onClick={onEndTurn}
          >
            结束回合
          </button>
        </div>

        {/* ================= ACTION HISTORY ================= */}
        <ActionHistory
          events={events}
          myUserId={me.userId}
        />

        {/* ================= PLAYER HALF ================= */}
        <div className="half player-half">
          <StatusBar
            statuses={me.statuses}
            currentTurn={currentTurn}
          />

          <div className="hp-bar player">
            <span className="hp-icon">❤️</span>
            <div className="hp-track">
              <div
                className="hp-fill"
                style={{ width: `${(me.hp / MAX_HP) * 100}%` }}
              />
            </div>
            <span className="hp-text">{me.hp}</span>

            {myDelta !== null && (
              <span
                className={`hp-delta ${
                  myDelta > 0 ? "heal" : "damage"
                }`}
              >
                {myDelta > 0 ? `+${myDelta}` : myDelta}
              </span>
            )}
          </div>

          <div className="hand-zone">
            {me.hand.map((card) => (
              <Card
                key={card.instanceId}
                cardId={card.cardId}
                disabled={!isMyTurn}
                onClick={() => onPlayCard(card)}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
