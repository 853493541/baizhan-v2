"use client";

import { useCallback, useEffect, useState } from "react";
import { GameResponse } from "./types";

const API_BASE = "http://localhost:5000";

export function useGameState(gameId: string) {
  const [game, setGame] = useState<GameResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchState = useCallback(async () => {
    const res = await fetch(`${API_BASE}/game/${gameId}`, {
      credentials: "include",
    });
    const data = await res.json();
    setGame(data);
  }, [gameId]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const playCard = async (
    cardInstanceId: string,
    targetUserId: string
  ) => {
    setLoading(true);
    await fetch(`${API_BASE}/game/play`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        gameId,
        cardInstanceId,
        targetUserId,
      }),
    });
    await fetchState();
    setLoading(false);
  };

  const passTurn = async () => {
    setLoading(true);
    await fetch(`${API_BASE}/game/pass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ gameId }),
    });
    await fetchState();
    setLoading(false);
  };

  return {
    game,
    loading,
    playCard,
    passTurn,
  };
}
