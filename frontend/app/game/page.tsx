"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function GamePage() {
  const router = useRouter();

  const [waitingGames, setWaitingGames] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  /* =========================================================
     Fetch current user (identity)
  ========================================================= */
  const fetchMe = async () => {
    const res = await fetch("/api/auth/me", {
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();
      setMe(data.user); // { uid, username }
    }
  };

  /* =========================================================
     Fetch waiting games
  ========================================================= */
  const fetchWaitingGames = async () => {
    const res = await fetch("/api/game/waiting", {
      credentials: "include",
    });

    if (res.ok) {
      setWaitingGames(await res.json());
    }
  };

  useEffect(() => {
    fetchMe();
    fetchWaitingGames();

    const t = setInterval(fetchWaitingGames, 3000);
    return () => clearInterval(t);
  }, []);

  /* =========================================================
     Create game
  ========================================================= */
  const createGame = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/game/create", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      router.push(`/game/room?gameId=${data._id}`);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     UI
  ========================================================= */
  return (
    <div style={{ padding: 32 }}>
      <h1>Game Lobby</h1>

      {me && (
        <p style={{ marginBottom: 12 }}>
          👤 Logged in as <strong>{me.username}</strong>
        </p>
      )}

      <button onClick={createGame} disabled={loading}>
        {loading ? "Creating..." : "Create Game"}
      </button>

      <h2 style={{ marginTop: 24 }}>Waiting Rooms</h2>

      {waitingGames.length === 0 && <p>No games waiting</p>}

      {waitingGames.map((g) => {
        const isMine = me && g.players?.[0] === me.uid;

        return (
          <div
            key={g._id}
            style={{
              border: "1px solid #ddd",
              padding: 12,
              marginBottom: 8,
              cursor: "pointer",
              background: isMine ? "#f0f9ff" : "white",
            }}
            onClick={() => router.push(`/game/room?gameId=${g._id}`)}
          >
            <div>
              <strong>Game ID:</strong> {g._id}
            </div>
            <div>
              Players: {g.players.length} / 2
            </div>
            {isMine && <div style={{ color: "#2563eb" }}>🟢 Your game</div>}
          </div>
        );
      })}
    </div>
  );
}
