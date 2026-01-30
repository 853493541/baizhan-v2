"use client";

import "./game-board.css";
import Card from "./card";
import StatusBar from "./statusBar";

/* ===============================
   Types
=============================== */
type CardInstance = {
  instanceId: string;
  cardId: string;
};

type PlayerState = {
  userId: string;
  hp: number;
  hand: CardInstance[];
  statuses?: any[];
};

type Props = {
  me: PlayerState;
  opponent: PlayerState;
  isMyTurn: boolean;
  onPlayCard: (card: CardInstance) => void;
  onEndTurn: () => void;
};

/* ===============================
   Component
=============================== */
export default function GameBoard({
  me,
  opponent,
  isMyTurn,
  onPlayCard,
  onEndTurn,
}: Props) {
  return (
    <div className="board-root">
      {/* ================= 对手 ================= */}
      <div className="opponent-zone">
        <div className="hp-badge opponent-hp">❤️ {opponent.hp}</div>
        <StatusBar statuses={opponent.statuses} />
      </div>

      {/* ================= 中央 ================= */}
      <div className="center-board">
        <div className="turn-indicator">
          {isMyTurn ? "🟢 你的回合" : "🔵 对手回合"}
        </div>
      </div>

      {/* ================= 玩家 ================= */}
      <div className="player-zone">
        <div className="player-top">
          <div>
            <div className="hp-badge player-hp">❤️ {me.hp}</div>
            <StatusBar statuses={me.statuses} />
          </div>

          <button
            className="end-turn-btn"
            disabled={!isMyTurn}
            onClick={onEndTurn}
          >
            结束回合
          </button>
        </div>

        {/* ================= 手牌 ================= */}
        <div className="hand-zone">
          {me.hand.map(card => (
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
  );
}
