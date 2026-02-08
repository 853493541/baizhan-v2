"use client";

import styles from "./styles.module.css";
import { useGamePreload } from "../../preload/GamePreloadContext";

/* ================= TYPES ================= */

type CardVariant = "hand" | "arena" | "preview" | "disabled";

type Props = {
  cardId: string;
  variant?: CardVariant;
  onClick?: () => void;
};

/* ================= HELPERS ================= */

function getCardIconByName(cardName: string | undefined) {
  if (!cardName) return null;

  // icons are named by Chinese display name, e.g. 剑破虚空.png
  return `/game/icons/Skills/${cardName}.png`;
}

/* ================= COMPONENT ================= */

export default function Card({
  cardId,
  variant = "hand",
  onClick,
}: Props) {
  const preload = useGamePreload();
  const card = preload.cardMap[cardId];

  const name = card?.name ?? cardId;
  const desc = card?.description ?? "暂无描述";
  const iconSrc = getCardIconByName(card?.name);

  // 🔑 IMPORTANT: do NOT coerce, show raw value
  const gcdValue = card?.gcdCost;

  const isClickable = variant === "hand";
  const isDisabled = variant === "disabled";

  return (
    <div
      className={[
        styles.card,
        styles[variant],
        isClickable && styles.clickable,
        isDisabled && styles.disabled,
      ]
        .filter(Boolean)
        .join(" ")}
      onClickCapture={isClickable ? onClick : undefined}
    >
      {/* ================= GCD DEBUG / DISPLAY ================= */}
      <div className={styles.gcdCrystal}>
        {String(gcdValue)}
      </div>

      <div className={styles.icon}>
        {iconSrc ? (
          <img src={iconSrc} alt={name} draggable={false} />
        ) : (
          <span>🀄</span>
        )}
      </div>

      <div className={styles.name}>{name}</div>

      <div className={styles.desc}>
        <div className={styles.descInner}>{desc}</div>
      </div>
    </div>
  );
}
