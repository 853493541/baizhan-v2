"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./styles.module.css";
import Dropdown from "../components/layout/dropdown";
import { rankCharacters, RankingCharacter } from "./statsRanking";

/* ===============================
   Role display (Chinese)
=============================== */
const ROLE_LABEL_MAP: Record<RankingCharacter["role"], string> = {
  Tank: "防御",
  DPS: "输出",
  Healer: "治疗",
};

const FALLBACK_ICON = "/icons/app_icon.png";

const getClassIcon = (cls?: string) =>
  cls
    ? `/icons/class_icons/${encodeURIComponent(cls)}.png`
    : FALLBACK_ICON;

export default function RankingPage() {
  const [characters, setCharacters] = useState<RankingCharacter[]>([]);
  const [loading, setLoading] = useState(true);

  /* ===============================
     Mobile detection
  =============================== */
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 600);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ===============================
     Filters
  =============================== */
  const [owner, setOwner] = useState("");
  const [server, setServer] = useState("");
  const [role, setRole] = useState("");
  const [onlyEnabled, setOnlyEnabled] = useState(true);

  /* ===============================
     Fetch data
  =============================== */
  useEffect(() => {
    const API_BASE =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    fetch(`${API_BASE}/api/characters/ranking`)
      .then((res) => res.json())
      .then((data) => {
        setCharacters(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[ranking] fetch failed", err);
        setLoading(false);
      });
  }, []);

  /* ===============================
     Filter options
  =============================== */
  const owners = useMemo(
    () => Array.from(new Set(characters.map((c) => c.owner))),
    [characters]
  );

  const servers = useMemo(
    () => Array.from(new Set(characters.map((c) => c.server))),
    [characters]
  );

  /* ===============================
     Ranking
  =============================== */
  const ranked = useMemo(
    () =>
      rankCharacters(characters, {
        owner,
        server,
        role,
        onlyEnabled,
      }),
    [characters, owner, server, role, onlyEnabled]
  );

  const topThree = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  /* ===============================
     List source (IMPORTANT)
  =============================== */
  const listData = isMobile ? ranked : rest;

  if (loading) {
    return <div className={styles.loading}>Loading ranking…</div>;
  }

  return (
    <div className={styles.rankingPage}>
      <h2 className={styles.title}>角色综合排行</h2>

    <div className={styles.filterSection}>
  <div className={styles.filterRow}>
    <div className={styles.leftGroup}>
      <Dropdown
        label="拥有者"
        options={["拥有者", ...owners]}
        value={owner || "拥有者"}
        onChange={(v) => setOwner(v === "拥有者" ? "" : v)}
      />

      <Dropdown
        label="服务器"
        options={["服务器", ...servers]}
        value={server || "服务器"}
        onChange={(v) => setServer(v === "服务器" ? "" : v)}
      />

      {(["Tank", "DPS", "Healer"] as const).map((r) => (
        <button
          key={r}
          className={`${styles.filterBtn} ${
            role === r ? styles.selected : ""
          }`}
          onClick={() => setRole(role === r ? "" : r)}
        >
          {ROLE_LABEL_MAP[r]}
        </button>
      ))}
    </div>

    {/* RIGHT SIDE */}
    <div className={styles.rightGroup}>
      <label className={styles.checkTag}>
        <input
          type="checkbox"
          checked={onlyEnabled}
          onChange={(e) => setOnlyEnabled(e.target.checked)}
        />
        <span>仅显示启用角色</span>
      </label>

      {/* ✅ RESET BUTTON — THIS WAS MISSING */}
      <button
        className={`${styles.filterBtn} ${styles.resetBtn}`}
        onClick={() => {
          setOwner("");
          setServer("");
          setRole("");
          setOnlyEnabled(true);
        }}
      >
        重置
      </button>
    </div>
  </div>
</div>


      {/* ===============================
          Podium (Desktop only)
      =============================== */}
      {!isMobile && (
        <div className={styles.podiumGrid}>
          {topThree[1] && (
            <PodiumCard c={topThree[1]} rank="second" rankNumber={2} />
          )}
          {topThree[0] && (
            <PodiumCard c={topThree[0]} rank="first" rankNumber={1} />
          )}
          {topThree[2] && (
            <PodiumCard c={topThree[2]} rank="third" rankNumber={3} />
          )}
        </div>
      )}

      {/* ===============================
          Ranking list
      =============================== */}
      <div className={styles.list}>
        {listData.map((c, index) => (
          <div
            key={c.characterId}
            className={`${styles.row} ${styles[c.role.toLowerCase()]}`}
          >
            <div className={styles.rank}>
              #{isMobile ? index + 1 : index + 4}
            </div>

            <div className={styles.main}>
              <div className={styles.name}>{c.name}</div>
            {!isMobile && (
  <div className={styles.meta}>
    {c.server} · {c.owner}
  </div>
)}
            </div>

            <div className={styles.stats}>
              <span className={styles.energy}>精神 {c.energy}</span>
              <span className={styles.durability}>耐力 {c.durability}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===============================
   Podium Card (local)
=============================== */
function PodiumCard({
  c,
  rank,
  rankNumber,
}: {
  c: RankingCharacter;
  rank: "first" | "second" | "third";
  rankNumber: 1 | 2 | 3;
}) {
  return (
    <div
      className={`${styles.podiumCard} ${styles[rank]} ${
        styles[c.role.toLowerCase()]
      }`}
    >
      <div className={`${styles.rankBadge} ${styles[`rank${rankNumber}`]}`}>
        {rankNumber}
      </div>

      <div className={styles.avatar}>
        <img
          src={getClassIcon(c.class)}
          alt={c.class}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = FALLBACK_ICON;
          }}
        />
      </div>

      <div className={styles.podiumName}>{c.name}</div>

      <div className={styles.podiumMeta}>{c.server}</div>

      <div className={styles.statChips}>
        <span className={styles.energy}>精神 {c.energy}</span>
        <span className={styles.durability}>耐力 {c.durability}</span>
      </div>
    </div>
  );
}
