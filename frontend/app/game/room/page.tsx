"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Me = {
  uid: string;
  username: string;
};

export default function RoomPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams.get("gameId");

  const [game, setGame] = useState<any>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [starting, setStarting] = useState(false);
  const [loadingGame, setLoadingGame] = useState(true);

  /* =========================================================
     Fetch current user
  ========================================================= */
  const fetchMe = async () => {
    const res = await fetch("/api/auth/me", {
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();
      setMe(data.user);
    }
  };

  /* =========================================================
     Fetch game (polling)
  ========================================================= */
  const fetchGame = async () => {
    if (!gameId) return;

    const res = await fetch(`/api/game/${gameId}`, {
      credentials: "include",
    });

    if (res.ok) {
      setGame(await res.json());
    }

    setLoadingGame(false);
  };

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    if (!gameId) return;

    fetchGame();
    const t = setInterval(fetchGame, 2000);
    return () => clearInterval(t);
  }, [gameId]);

  /* =========================================================
     🔥 REDIRECT GUEST WHEN GAME STARTS
  ========================================================= */
  useEffect(() => {
    if (!gameId || !game || !me) return;

    const playerIds: string[] = Array.isArray(game.players)
      ? game.players
      : [];

    const isHost = playerIds[0] === me.uid;

    if (game.started && !isHost) {
      router.replace(`/game/in-game?gameId=${gameId}`);
    }
  }, [game, me, gameId, router]);

  /* =========================================================
     Join game
  ========================================================= */
  const joinGame = async () => {
    const res = await fetch(`/api/game/join/${gameId}`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) {
      alert(await res.text());
      return;
    }

    fetchGame();
  };

  /* =========================================================
     Start game (HOST)
  ========================================================= */
  const startGame = async () => {
    setStarting(true);
    try {
      const res = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ gameId }),
      });

      if (!res.ok) throw new Error(await res.text());

      // Host redirects immediately
      router.push(`/game/in-game?gameId=${gameId}`);
    } finally {
      setStarting(false);
    }
  };

  /* =========================================================
     Derived state
  ========================================================= */
  const playerIds: string[] = Array.isArray(game?.players)
    ? game.players
    : [];

  const playersJoined = playerIds.length;
  const ready = playersJoined === 2;

  const myId = me?.uid;
  const isInGame = !!(myId && playerIds.includes(myId));
  const isHost = playerIds[0] === myId;

  const canJoin =
    !!me && !isInGame && playersJoined < 2 && !loadingGame;

  const shareLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/game/room?gameId=${gameId}`
      : "";

  /* =========================================================
     UI
  ========================================================= */
  if (!gameId) {
    return <div style={{ padding: 32 }}>Missing gameId</div>;
  }

  return (
    <div style={{ padding: 32 }}>
      <h1>Game Room</h1>

      {me && (
        <p>
          👤 Logged in as <strong>{me.username}</strong>
        </p>
      )}

      <div>Game ID: {gameId}</div>
      <div>Players joined: {playersJoined} / 2</div>

      {isHost && <p style={{ color: "#16a34a" }}>🟢 You are the host</p>}
      {!isHost && isInGame && (
        <p style={{ color: "#2563eb" }}>🔵 You joined this game</p>
      )}

      {canJoin && (
        <>
          <p>Waiting for opponent…</p>
          <input
            readOnly
            value={shareLink}
            style={{ width: "100%", marginBottom: 12 }}
          />
          <button onClick={joinGame}>Join Game</button>
        </>
      )}

      {ready && isHost && (
        <button onClick={startGame} disabled={starting}>
          {starting ? "Starting..." : "Start Game"}
        </button>
      )}

      {ready && !isHost && (
        <p>Waiting for host to start the game…</p>
      )}
    </div>
  );
}
