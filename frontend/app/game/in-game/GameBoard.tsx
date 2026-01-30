"use client";

import "./game-board.css";
import Card from "./card";
import StatusBar from "./statusBar";

/* ================= TYPES ================= */

type CardInstance = {
  instanceId: string;
  cardId: string;
};

type Status = {
  type: string;
  value?: number;
  chance?: number;
  repeatTurns?: number;
  sourceCardId?: string;
  appliedAtTurn: number;
  expiresAtTurn: number;
};

type PlayerState = {
  userId: string;
  hp: number;
  hand: CardInstance[];
  statuses: Status[];
};

type Props = {
  me: PlayerState;
  opponent: PlayerState;
  isMyTurn: boolean;
  onPlayCard: (card: CardInstance) => void;
  onEndTurn: () => void;
  currentTurn: number;
};

/* ================= COMPONENT ================= */

export default function GameBoard({
  me,
  opponent,
  isMyTurn,
  onPlayCard,
  onEndTurn,
  currentTurn,
}: Props) {
  return (
    <div className="board-root">
      <div className="opponent-zone">
        <div className="hp-badge opponent-hp">❤️ {opponent.hp}</div>
        <StatusBar
          statuses={opponent.statuses}
          currentTurn={currentTurn}
        />
      </div>

      <div className="center-board">
        <div className="turn-indicator">
          {isMyTurn ? "🟢 你的回合" : "🔵 对手回合"}
        </div>
      </div>

      <div className="player-zone">
        <div className="player-top">
          <div>
            <div className="hp-badge player-hp">❤️ {me.hp}</div>
            <StatusBar
              statuses={me.statuses}
              currentTurn={currentTurn}
            />
          </div>

          <button
            className="end-turn-btn"
            disabled={!isMyTurn}
            onClick={onEndTurn}
          >
            结束回合
          </button>
        </div>

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
