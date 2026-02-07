"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CardInstance, GameResponse } from "../types";

/* ================= DIFF APPLY ================= */

type DiffPatch = {
  path: string;
  value: any;
};

function applyDiff<T extends object>(prev: T, diff: DiffPatch[]): T {
  const next = structuredClone(prev);

  for (const { path, value } of diff) {
    // full replace
    if (path === "/") {
      return value;
    }

    const keys = path.split("/").filter(Boolean);
    let target: any = next;

    for (let i = 0; i < keys.length - 1; i++) {
      target = target[keys[i]];
      if (target == null) return next;
    }

    const lastKey = keys[keys.length - 1];
    if (value === undefined) {
      delete target[lastKey];
    } else {
      target[lastKey] = value;
    }
  }

  return next;
}

/* ================= HOOK ================= */

export function useGameState(gameId: string, selfUserId: string) {
  const [game, setGame] = useState<GameResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);

  // track last known version
  const versionRef = useRef<number>(0);

  /* ================= INITIAL SNAPSHOT ================= */

  const fetchInitialGame = useCallback(async () => {
    const res = await fetch(`/api/game/${gameId}`, {
      credentials: "include",
    });

    if (!res.ok) {
      setLoading(false);
      return;
    }

    const full = await res.json();
    versionRef.current = full.state.version;
    setGame(full);
    setLoading(false);
  }, [gameId]);

  useEffect(() => {
    fetchInitialGame();
  }, [fetchInitialGame]);

  /* ================= DIFF POLLING ================= */

  useEffect(() => {
    if (!game) return;

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/game/${gameId}/diff?sinceVersion=${versionRef.current}`,
          { credentials: "include" }
        );

        if (!res.ok) return;

        const patch = await res.json();

        if (!patch.diff || patch.diff.length === 0) return;

        versionRef.current = patch.version;

        setGame((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            state: applyDiff(prev.state, patch.diff),
          };
        });
      } catch {
        // ignore polling errors
      }
    };

    const t = setInterval(poll, 2000);
    return () => clearInterval(t);
  }, [game, gameId]);

  /* ================= GUARDS ================= */

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
        }),
      });

      if (!res.ok) {
        return { ok: false, error: await res.text() };
      }

      const patch = await res.json();
      versionRef.current = patch.version;

      setGame((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          state: applyDiff(prev.state, patch.diff),
        };
      });

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

      const patch = await res.json();
      versionRef.current = patch.version;

      setGame((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          state: applyDiff(prev.state, patch.diff),
        };
      });

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
