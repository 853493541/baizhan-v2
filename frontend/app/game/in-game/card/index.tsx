"use client";

import styles from "./styles.module.css";
import { CARD_DESC_MAP } from "./cardDescriptions";

/* ================= CARD NAME MAP ================= */

const CARD_NAME_MAP: Record<string, string> = {
  /* 基础攻击 */
  jianpo_xukong: "剑破虚空",
  sanhuan_taoyue: "三环套月",
  baizu: "百足",

  /* 控制 / 压制 */
  mohe_wuliang: "摩诃无量",
  shengsi_jie: "生死劫",
  chan_xiao: "蟾啸",
  da_shizi_hou: "大狮子吼",
  jiangchun_zhuxiu: "绛唇珠袖",

  /* 解控 / 防御 */
  jiru_feng: "疾如风",
  sanliu_xia: "散流霞",
  que_ta_zhi: "鹊踏枝",

  /* 生存 / 回复 */
  fengxiu_diang: "风袖低昂",
  qionglong_huasheng: "穹隆化生",

  /* 隐身 / 干扰 */
  anchen_misan: "暗尘弥散",
  fuguang_lueying: "浮光掠影",
  tiandi_wuji: "天地无极",

  /* 持续运功 / 节奏 */
  fenglai_wushan: "风来吴山",
  wu_jianyu: "无间狱",
  xinzheng: "心诤",

  /* 爆发 / 强化 */
  nuwa_butian: "女娲补天",
  taxingxing: "踏星行",
  zhuiming_jian: "追命箭",

  /* 其他 */
  quye_duanchou: "驱夜断愁",
};

/* ================= ICON MAP ================= */

const CARD_ICON_MAP: Record<string, string> = {
  /* 基础攻击 */
  jianpo_xukong: "剑破虚空.png",
  sanhuan_taoyue: "三环套月.png",
  baizu: "百足.png",

  /* 控制 / 压制 */
  mohe_wuliang: "摩诃无量.png",
  shengsi_jie: "生死劫.png",
  chan_xiao: "蟾啸.png",
  da_shizi_hou: "大狮子吼.png",
  jiangchun_zhuxiu: "绛唇珠袖.png",

  /* 解控 / 防御 */
  jiru_feng: "疾如风.png",
  sanliu_xia: "散流霞.png",
  que_ta_zhi: "鹊踏枝.png",

  /* 生存 / 回复 */
  fengxiu_diang: "风袖低昂.png",
  qionglong_huasheng: "穹隆化生.png",

  /* 隐身 / 干扰 */
  anchen_misan: "暗尘弥散.png",
  fuguang_lueying: "浮光掠影.png",
  tiandi_wuji: "天地无极.png",

  /* 持续运功 / 节奏 */
  fenglai_wushan: "风来吴山.png",
  wu_jianyu: "无间狱.png",
  xinzheng: "心诤.png",

  /* 爆发 / 强化 */
  nuwa_butian: "女娲补天.png",
  taxingxing: "踏星行.png",
  zhuiming_jian: "追命箭.png",

  /* 其他 */
  quye_duanchou: "驱夜断愁.png",
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
      // ✅ capture phase click so desc scroll area can't swallow it
      onClickCapture={isClickable ? onClick : undefined}
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
