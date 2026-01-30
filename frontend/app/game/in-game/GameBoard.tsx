"use client";

import "./game-board.css";

/* ===============================
   临时前端中文卡名映射（Band-aid）
   ⚠️ 仅用于显示，不影响后端/规则
=============================== */
const CARD_NAME_MAP: Record<string, string> = {
  strike: "剑破",
  heal_dr: "风袖",
  disengage: "暗尘",
  power_surge: "女娲",
  silence: "蝉啸",
  channel: "风来吴山",
};

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
        <div className="hp-badge opponent-hp">
          ❤️ {opponent.hp}
        </div>
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
          <div className="hp-badge player-hp">
            ❤️ {me.hp}
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
            <button
              key={card.instanceId}
              className="card"
              disabled={!isMyTurn}
              onClick={() => onPlayCard(card)}
            >
              {CARD_NAME_MAP[card.cardId] ?? card.cardId}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
