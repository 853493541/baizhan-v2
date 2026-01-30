"use client";

import { useEffect, useState } from "react";

interface Props {
  gameId: string;
  selfUserId: string;
  selfUsername: string;
}

export default function InGame({
  gameId,
  selfUserId,
  selfUsername,
}: Props) {
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* =========================================================
     Fetch game state (authoritative)
  ========================================================= */
  const fetchGame = async () => {
    try {
      const res = await fetch(`/api/game/${gameId}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();
      setGame(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load game");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGame();
    const t = setInterval(fetchGame, 1500);
    return () => clearInterval(t);
  }, [gameId]);

  /* =========================================================
     Derived state
  ========================================================= */
  const playerIds: string[] = Array.isArray(game?.players)
    ? game.players
    : [];

  const myIndex = playerIds.indexOf(selfUserId);
  const isPlayer = myIndex !== -1;
  const isMyTurn = game?.state?.activePlayerIndex === myIndex;

  /* =========================================================
     UI
  ========================================================= */
  if (loading) {
    return <div style={{ padding: 32 }}>Loading game…</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 32, color: "red" }}>
        Error: {error}
      </div>
    );
  }

  if (!isPlayer) {
    return (
      <div style={{ padding: 32 }}>
        You are not a player in this game.
      </div>
    );
  }

  return (
    <div style={{ padding: 32 }}>
      <h1>In Game</h1>

      <p>
        👤 You are <strong>{selfUsername}</strong>
      </p>

      <p>
        Game ID: <code>{gameId}</code>
      </p>

      <p>
        Players: {playerIds.length} / 2
      </p>

      <hr />

      <h2>Turn</h2>
      {isMyTurn ? (
        <p style={{ color: "#16a34a" }}>🟢 Your turn</p>
      ) : (
        <p style={{ color: "#2563eb" }}>🔵 Opponent’s turn</p>
      )}

      <hr />

      <h2>Your Hand</h2>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {game?.state?.players?.[myIndex]?.hand?.map((card: any) => (
          <div
            key={card.instanceId}
            style={{
              border: "1px solid #ccc",
              padding: 8,
              borderRadius: 4,
              minWidth: 80,
              textAlign: "center",
            }}
          >
            {card.cardId}
          </div>
        ))}
      </div>

      <hr />

      <h2>Status</h2>
      <pre style={{ background: "#f8f8f8", padding: 12 }}>
        {JSON.stringify(
          {
            hp: game?.state?.players?.[myIndex]?.hp,
            statuses: game?.state?.players?.[myIndex]?.statuses,
          },
          null,
          2
        )}
      </pre>
    </div>
  );
}
