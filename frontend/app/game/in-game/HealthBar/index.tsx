"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";

type Props = {
  hp: number;
  maxHp: number;
  side: "player" | "enemy";
};

export default function HealthBar({ hp, maxHp, side }: Props) {
  const prevHp = useRef(hp);
  const [delta, setDelta] = useState<number | null>(null);

  /* ================= HYBRID DELTA LOGIC =================
     - Shows delta immediately on HP change
     - Replaces old delta if another change happens
     - Auto-clears after timeout if no further change
  ======================================================= */

  useEffect(() => {
    const diff = hp - prevHp.current;
    if (diff !== 0) {
      setDelta(diff);

      const timer = setTimeout(() => {
        setDelta(null);
      }, 1400); // ⏱️ hybrid persistence window

      prevHp.current = hp;

      return () => clearTimeout(timer);
    }
  }, [hp]);

  return (
    <div className={`${styles.hpBar} ${styles[side]}`}>
      <span className={styles.hpIcon}>❤️</span>

      <div className={styles.hpTrack}>
        <div
          className={styles.hpFill}
          style={{ width: `${(hp / maxHp) * 100}%` }}
        />
      </div>

      <span className={styles.hpText}>{hp}</span>

      {delta !== null && (
        <span
          className={`${styles.hpDelta} ${
            delta > 0 ? styles.heal : styles.damage
          }`}
        >
          {delta > 0 ? `+${delta}` : delta}
        </span>
      )}
    </div>
  );
}
