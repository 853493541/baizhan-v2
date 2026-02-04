"use client";

import { useCallback, useEffect, useState } from "react";
import type { CardInstance, GameResponse } from "../types";

export function useGameState(gameId: string, selfUserId: string) {
  const [game, setGame] = useState<GameResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);

  /* ================= FETCH GAME ================= */

  const fetchGame = useCallback(async () => {
    const res = await fetch(`/api/game/${gameId}`, {
      credentials: "include",
    });

    if (res.ok) {
      setGame(await res.json());
    }

    setLoading(false);
  }, [gameId]);

  useEffect(() => {
    fetchGame();
    const t = setInterval(fetchGame, 2000);
    return () => clearInterval(t);
  }, [fetchGame]);

  if (!game) {
    return {
      loading,
      state: null,
      me: null,
      opponent: null,
      isMyTurn: false,
      isWinner: false,
      playCard: async () => ({ ok: false }),
      endTurn: async () => ({ ok: false }),
    };
  }

  const state = game.state;
  const players = state.players;

  const meIndex = players.findIndex(
    (p) => p.userId === selfUserId
  );
  const opponentIndex = meIndex === 0 ? 1 : 0;

  const me = players[meIndex];
  const opponent = players[opponentIndex];

  const isMyTurn = state.activePlayerIndex === meIndex;
  const isWinner = state.winnerUserId === selfUserId;

  /* ================= PLAY CARD ================= */

  const playCard = async (card: CardInstance) => {
    if (!isMyTurn || playing || state.gameOver) {
      return { ok: false };
    }

    setPlaying(true);
    try {
      const res = await fetch("/api/game/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          gameId,
          cardInstanceId: card.instanceId,
          // ✅ NO target logic here anymore
        }),
      });

      if (!res.ok) {
        return { ok: false, error: await res.text() };
      }

      await fetchGame();
      return { ok: true };
    } finally {
      setPlaying(false);
    }
  };

  /* ================= END TURN ================= */

  const endTurn = async () => {
    if (!isMyTurn || playing || state.gameOver) {
      return { ok: false };
    }

    setPlaying(true);
    try {
      const res = await fetch("/api/game/pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ gameId }),
      });

      if (!res.ok) {
        return { ok: false, error: await res.text() };
      }

      await fetchGame();
      return { ok: true };
    } finally {
      setPlaying(false);
    }
  };

  return {
    loading,
    state,
    me,
    opponent,
    isMyTurn,
    isWinner,
    playCard,
    endTurn,
  };
}
