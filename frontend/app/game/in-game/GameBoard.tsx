"use client";

import "./game-board.css";

import OpponentArea from "./OpponentArea";
import PlayerArea from "./PlayerArea";
import CurrentAction from "./CurrentAction";
import ActionHistory from "./ActionHistory";
import EndTurn from "./EndTurn";

import type {
  CardInstance,
  PlayerState,
  GameEvent,
} from "@/app/game/in-game/types";

type Props = {
  me: PlayerState;
  opponent: PlayerState;
  events: GameEvent[];
  isMyTurn: boolean;
  onPlayCard: (card: CardInstance) => void;
  onEndTurn: () => void;
  currentTurn: number;
};

export default function GameBoard({
  me,
  opponent,
  events,
  isMyTurn,
  onPlayCard,
  onEndTurn,
  currentTurn,
}: Props) {
  return (
    <div className="board-root">
      <div className="board">

        {/* 🟥 OPPONENT AREA (TOP ANCHOR) */}
        <div className="region" >
          <OpponentArea
            opponent={opponent}
            currentTurn={currentTurn}
          />
        </div>

        {/* 🟨 ARENA / CARDS USED (FLEX SPACE) */}
        <div className="region">
          <CurrentAction
            events={events}
            myUserId={me.userId}
          />
        </div>

        {/* 🟩 PLAYER AREA (BOTTOM ANCHOR) */}
        <div className="region">
          <PlayerArea
            me={me}
            currentTurn={currentTurn}
            isMyTurn={isMyTurn}
            onPlayCard={onPlayCard}
          />
        </div>

        {/* 🟦 HISTORY – LEFT MIDDLE */}
        <div className="history-overlay">
          <ActionHistory
            events={events}
            myUserId={me.userId}
          />
        </div>

        {/* 🔘 END TURN – RIGHT MIDDLE */}
        <div className="endturn-overlay">
          <EndTurn
            isMyTurn={isMyTurn}
            onEndTurn={onEndTurn}
          />
        </div>

      </div>
    </div>
  );
}
