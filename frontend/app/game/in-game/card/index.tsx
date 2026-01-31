"use client";

import styles from "./styles.module.css";
import { CARD_DESC_MAP } from "./cardDescriptions";

/* ================= CARD NAME MAP ================= */

const CARD_NAME_MAP: Record<string, string> = {
  jianpo_xukong: "剑破虚空",
  sanhuan_taoyue: "三环套月",
  mohe_wuliang: "摩诃无量",
  shengsi_jie: "生死劫",
  chan_xiao: "蟾啸",
  jiru_feng: "疾如风",
  sanliu_xia: "散流霞",
  que_ta_zhi: "鹊踏枝",
  fengxiu_diang: "风袖低昂",
  qiandie_turui: "千蝶吐瑞",
  anchen_misan: "暗尘弥散",
  fenglai_wushan: "风来吴山",
  wu_jianyu: "无间狱",
  baizu: "百足",
  nuwa_butian: "女娲补天",
};

/* ================= ICON MAP ================= */

const CARD_ICON_MAP: Record<string, string> = {
  jianpo_xukong: "剑破虚空.png",
  sanhuan_taoyue: "三环套月.png",
  mohe_wuliang: "摩诃无量.png",
  shengsi_jie: "生死劫.png",
  chan_xiao: "蟾啸.png",
  jiru_feng: "疾如风.png",
  sanliu_xia: "散流霞.png",
  que_ta_zhi: "鹊踏枝.png",
  fengxiu_diang: "风袖低昂.png",
  qiandie_turui: "千蝶吐瑞.png",
  anchen_misan: "暗尘弥散.png",
  fenglai_wushan: "风来吴山.png",
  wu_jianyu: "无间狱.png",
  baizu: "百足.png",
  nuwa_butian: "女娲补天.png",
};

function getCardIcon(cardId: string) {
  const file = CARD_ICON_MAP[cardId];
  if (!file) return null;
  return `/game/icons/Skills/${file}`;
}

/* ================= TYPES ================= */

type CardVariant = "hand" | "arena" | "preview" | "disabled";

type Props = {
  cardId: string;
  variant?: CardVariant;
  onClick?: () => void;
};

/* ================= COMPONENT ================= */

export default function Card({
  cardId,
  variant = "hand",
  onClick,
}: Props) {
  const name = CARD_NAME_MAP[cardId] ?? cardId;
  const desc = CARD_DESC_MAP[cardId] ?? "暂无描述";
  const iconSrc = getCardIcon(cardId);

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
      onClick={isClickable ? onClick : undefined}
    >
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
