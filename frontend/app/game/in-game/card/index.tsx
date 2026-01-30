"use client";

import styles from "./styles.module.css";
import { CARD_DESC_MAP } from "./cardDescriptions";

/* ===============================
   Card Name Map (display only)
=============================== */
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

/* ===============================
   Card Icon Map
=============================== */
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

type Props = {
  cardId: string;
  disabled?: boolean;
  onClick?: () => void;
};

export default function Card({ cardId, disabled, onClick }: Props) {
  const name = CARD_NAME_MAP[cardId] ?? cardId;
  const desc = CARD_DESC_MAP[cardId] ?? "暂无描述";
  const iconSrc = getCardIcon(cardId);

  return (
    <div
      className={`${styles.card} ${disabled ? styles.disabled : ""}`}
      onClick={!disabled ? onClick : undefined}
    >
      {/* Icon */}
      <div className={styles.icon}>
        {iconSrc ? (
          <img
            src={iconSrc}
            alt={name}
            draggable={false}
          />
        ) : (
          <span>🀄</span>
        )}
      </div>

      {/* Name */}
      <div className={styles.name}>{name}</div>

      {/* Description */}
      <div className={styles.desc}>{desc}</div>
    </div>
  );
}
