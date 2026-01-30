"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GameBoard from "./GameBoard";
import GameOverModal from "./GameOverModal";

/* ================= TYPES (ALIGNED WITH BACKEND) ================= */

type CardInstance = {
  instanceId: string;
  cardId: string;
};

type EffectCategory = "BUFF" | "DEBUFF";

type Status = {
  type: string;
  value?: number;
  sourceCardId?: string;
  category?: EffectCategory;
  appliedAtTurn: number;
  expiresAtTurn: number;
  repeatTurns?: number;
  chance?: number;
  breakOnPlay?: boolean;
};

type PlayerState = {
  userId: string;
  hp: number;
  hand: CardInstance[];
  statuses: Status[];
};

type GameState = {
  players: PlayerState[];
  activePlayerIndex: number;
  turn: number;
  gameOver: boolean;
  winnerUserId?: string;
};

type Props = {
  gameId: string;
  selfUserId: string;
  selfUsername: string;
};

/* ================= CARD TARGET MAP ================= */
/* (Legacy map kept untouched — even if unused) */
const CARD_TARGET: Record<string, "SELF" | "OPPONENT"> = {
  strike: "OPPONENT",
  silence: "OPPONENT",
  channel: "OPPONENT",

  heal_dr: "SELF",
  disengage: "SELF",
  power_surge: "SELF",
};

export default function InGameClient({
  gameId,
  selfUserId,
}: Props) {
  const router = useRouter();

  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);

  /* ================= FETCH GAME ================= */
  const fetchGame = async () => {
    const res = await fetch(`/api/game/${gameId}`, {
      credentials: "include",
    });

    if (res.ok) {
      setGame(await res.json());
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchGame();
    const t = setInterval(fetchGame, 2000);
    return () => clearInterval(t);
  }, [gameId]);

  if (loading || !game) {
    return <div>Loading game…</div>;
  }

  const state: GameState = game.state;
  const players = state.players;

  const meIndex = players.findIndex(
    p => p.userId === selfUserId
  );
  const opponentIndex = meIndex === 0 ? 1 : 0;

  const me = players[meIndex];
  const opponent = players[opponentIndex];

  const isMyTurn = state.activePlayerIndex === meIndex;
  const isWinner = state.winnerUserId === selfUserId;

  /* ================= PLAY CARD ================= */
  const playCard = async (card: CardInstance) => {
    if (!isMyTurn || playing || state.gameOver) return;

    const targetType = CARD_TARGET[card.cardId];
    const targetUserId =
      targetType === "SELF"
        ? selfUserId
        : opponent.userId;

    setPlaying(true);
    try {
      const res = await fetch("/api/game/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          gameId,
          cardInstanceId: card.instanceId,
          targetUserId,
        }),
      });

      if (!res.ok) {
        alert(await res.text());
        return;
      }

      await fetchGame();
    } finally {
      setPlaying(false);
    }
  };

  /* ================= END TURN ================= */
  const endTurn = async () => {
    if (!isMyTurn || playing || state.gameOver) return;

    setPlaying(true);
    try {
      const res = await fetch("/api/game/pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ gameId }),
      });

      if (!res.ok) {
        alert(await res.text());
        return;
      }

      await fetchGame();
    } finally {
      setPlaying(false);
    }
  };

  /* ================= BOARD + GAME OVER MODAL ================= */
  return (
    <>
      <GameBoard
        me={me}
        opponent={opponent}
        isMyTurn={isMyTurn}
        onPlayCard={playCard}
        currentTurn={state.turn}
        onEndTurn={endTurn}
      />

      {state.gameOver && (
        <GameOverModal
          isWinner={isWinner}
          onExit={() => router.push("/game")}
        />
      )}
    </>
  );
}
