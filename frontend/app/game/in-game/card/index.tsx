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
  chan_xiao: "蝉啸",
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

type Props = {
  cardId: string;
  disabled?: boolean;
  onClick?: () => void;
};

export default function Card({ cardId, disabled, onClick }: Props) {
  const name = CARD_NAME_MAP[cardId] ?? cardId;
  const desc = CARD_DESC_MAP[cardId] ?? "暂无描述";

  return (
    <div
      className={`${styles.card} ${disabled ? styles.disabled : ""}`}
      onClick={!disabled ? onClick : undefined}
    >
      {/* Icon */}
      <div className={styles.icon}>🀄</div>

      {/* Name */}
      <div className={styles.name}>{name}</div>

      {/* Description */}
      <div className={styles.desc}>{desc}</div>
    </div>
  );
}
