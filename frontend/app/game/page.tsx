"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles.module.css";

export default function GamePage() {
  const router = useRouter();

  const [waitingGames, setWaitingGames] = useState<any[]>([]);
  const [ongoingGames, setOngoingGames] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  /* =========================================================
     Fetch current user
  ========================================================= */
  const fetchMe = async () => {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setMe(data.user);
    }
  };

  /* =========================================================
     Fetch waiting rooms
  ========================================================= */
  const fetchWaitingGames = async () => {
    const res = await fetch("/api/game/waiting", {
      credentials: "include",
    });

    if (res.ok) {
      setWaitingGames(await res.json());
    }
  };

  /* =========================================================
     Fetch ongoing games (joined + started)
  ========================================================= */
  const fetchOngoingGames = async () => {
    const res = await fetch("/api/game/ongoing", {
      credentials: "include",
    });

    if (res.ok) {
      setOngoingGames(await res.json());
    }
  };

  useEffect(() => {
    fetchMe();
    fetchWaitingGames();
    fetchOngoingGames();

    const t = setInterval(() => {
      fetchWaitingGames();
      fetchOngoingGames();
    }, 3000);

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
    <div className={styles.page}>
      <h1 className={styles.title}>Game Lobby</h1>

      {me && (
        <p className={styles.user}>
          👤 Logged in as <strong>{me.username}</strong>
        </p>
      )}

      <button
        className={styles.createBtn}
        onClick={createGame}
        disabled={loading}
      >
        {loading ? "Creating..." : "Create Game"}
      </button>

      {/* ================= ONGOING ================= */}
      <h2 className={styles.sectionTitle}>🟢 Ongoing Matches</h2>

      {ongoingGames.length === 0 && (
        <p className={styles.empty}>No ongoing matches</p>
      )}

      {ongoingGames.map((g) => (
        <div
          key={g._id}
          className={styles.card}
          onClick={() =>
            router.push(`/game/in-game?gameId=${g._id}`)
          }
        >
          <div className={styles.cardTitle}>
            Match #{g._id.slice(-6)}
          </div>
          <div>Players: {g.players.length} / 2</div>
        </div>
      ))}

      {/* ================= WAITING ================= */}
      <h2 className={styles.sectionTitle}>🟡 Waiting Rooms</h2>

      {waitingGames.length === 0 && (
        <p className={styles.empty}>No rooms waiting</p>
      )}

      {waitingGames.map((g) => {
        const isMine = me && g.players?.[0] === me.uid;

        return (
          <div
            key={g._id}
            className={`${styles.card} ${
              isMine ? styles.mine : ""
            }`}
            onClick={() =>
              router.push(`/game/room?gameId=${g._id}`)
            }
          >
            <div className={styles.cardTitle}>
              {isMine ? "Your Room" : "Open Room"} #{g._id.slice(-6)}
            </div>
            <div>Players: {g.players.length} / 2</div>
          </div>
        );
      })}
    </div>
  );
}
