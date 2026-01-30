"use client";

import "./game-board.css";

type CardInstance = {
  instanceId: string;
  cardId: string;
};

type PlayerState = {
  userId: string;
  hp: number;
  hand: CardInstance[];
};

type Props = {
  me: PlayerState;
  opponent: PlayerState;
  isMyTurn: boolean;
  onPlayCard: (card: CardInstance) => void;
  onEndTurn: () => void;
};

export default function GameBoard({
  me,
  opponent,
  isMyTurn,
  onPlayCard,
  onEndTurn,
}: Props) {
  return (
    <div className="board-root">
      {/* ================= Opponent ================= */}
      <div className="opponent-zone">
        <div className="hp-badge opponent-hp">
          ❤️ {opponent.hp}
        </div>
      </div>

      {/* ================= Board ================= */}
      <div className="center-board">
        <div className="turn-indicator">
          {isMyTurn ? "🟢 Your Turn" : "🔵 Opponent Turn"}
        </div>
      </div>

      {/* ================= Player ================= */}
      <div className="player-zone">
        <div className="player-top">
          <div className="hp-badge player-hp">
            ❤️ {me.hp}
          </div>

          <button
            className="end-turn-btn"
            disabled={!isMyTurn}
            onClick={onEndTurn}
          >
            End Turn
          </button>
        </div>

        <div className="hand-zone">
          {me.hand.map(card => (
            <button
              key={card.instanceId}
              className="card"
              disabled={!isMyTurn}
              onClick={() => onPlayCard(card)}
            >
              {card.cardId}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
