"use client";

import { useEffect, useState } from "react";

interface Props {
  gameId: string;
  selfUserId: string;
  selfUsername: string;
}

export default function InGameClient({
  gameId,
  selfUserId,
  selfUsername,
}: Props) {
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* =========================================================
     Fetch game state (polling)
  ========================================================= */
  const fetchGame = async () => {
    const res = await fetch(`/api/game/${gameId}`, {
      credentials: "include",
      cache: "no-store",
    });

    if (res.ok) {
      setGame(await res.json());
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchGame();
    const t = setInterval(fetchGame, 1500);
    return () => clearInterval(t);
  }, [gameId]);

  if (loading || !game?.state) {
    return <div style={{ padding: 32 }}>Loading game…</div>;
  }

  /* =========================================================
     Derived state
  ========================================================= */
  const state = game.state;

  const myIndex = state.players.findIndex(
    (p: any) => p.userId === selfUserId
  );

  const opponentIndex = myIndex === 0 ? 1 : 0;

  const isMyTurn = state.activePlayerIndex === myIndex;

  const me = state.players[myIndex];
  const opponent = state.players[opponentIndex];

  /* =========================================================
     Actions
  ========================================================= */
  const playCard = async (cardInstanceId: string) => {
    if (!isMyTurn) return;

    const res = await fetch("/api/game/play", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameId,
        cardInstanceId,
        targetUserId: opponent.userId,
      }),
    });

    if (!res.ok) {
      alert(await res.text());
      return;
    }

    fetchGame();
  };

  const endTurn = async () => {
    if (!isMyTurn) return;

    const res = await fetch("/api/game/pass", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId }),
    });

    if (!res.ok) {
      alert(await res.text());
      return;
    }

    fetchGame();
  };

  /* =========================================================
     UI
  ========================================================= */
  return (
    <div style={{ padding: 32 }}>
      <h1>In Game</h1>

      <p>
        👤 You are <strong>{selfUsername}</strong>
      </p>

      <div>Game ID: {gameId}</div>
      <div>Players: 2 / 2</div>

      <hr />

      <h2>Turn</h2>
      {isMyTurn ? (
        <p style={{ color: "#16a34a" }}>🟢 Your turn</p>
      ) : (
        <p style={{ color: "#2563eb" }}>🔵 Opponent’s turn</p>
      )}

      <hr />

      <h2>Your Hand</h2>
      <div style={{ display: "flex", gap: 8 }}>
        {me.hand.map((card: any) => (
          <button
            key={card.instanceId}
            onClick={() => playCard(card.instanceId)}
            disabled={!isMyTurn}
            style={{
              padding: "8px 12px",
              opacity: isMyTurn ? 1 : 0.5,
              cursor: isMyTurn ? "pointer" : "not-allowed",
            }}
          >
            {card.cardId}
          </button>
        ))}
      </div>

      <hr />

      <button
        onClick={endTurn}
        disabled={!isMyTurn}
        style={{
          marginTop: 16,
          padding: "10px 16px",
          fontSize: 16,
          opacity: isMyTurn ? 1 : 0.5,
        }}
      >
        End Turn
      </button>

      <hr />

      <h2>Status</h2>
      <pre style={{ background: "#f5f5f5", padding: 12 }}>
        {JSON.stringify(
          {
            hp: me.hp,
            statuses: me.statuses,
          },
          null,
          2
        )}
      </pre>

      <h2>Opponent</h2>
      <pre style={{ background: "#f5f5f5", padding: 12 }}>
        {JSON.stringify(
          {
            hp: opponent.hp,
            statuses: opponent.statuses,
          },
          null,
          2
        )}
      </pre>
    </div>
  );
}
