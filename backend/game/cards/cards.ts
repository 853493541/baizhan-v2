// backend/game/cards/cards.ts

import { Card } from "../engine/types";

export const CARDS: Record<string, Card> = {
  /* =========================================================
     基础攻击
  ========================================================= */
  jianpo_xukong: {
    id: "jianpo_xukong",
    name: "剑破虚空",
    type: "ATTACK",
    target: "OPPONENT",
    effects: [{ type: "DAMAGE", value: 10 }],
  },

  sanhuan_taoyue: {
    id: "sanhuan_taoyue",
    name: "三环套月",
    type: "ATTACK",
    target: "OPPONENT",
    effects: [
      { type: "DAMAGE", value: 5 },
      { type: "DRAW", value: 1 },
    ],
  },

  baizu: {
    id: "baizu",
    name: "百足",
    type: "ATTACK",
    target: "OPPONENT",
    effects: [
      { type: "DAMAGE", value: 5 },
      { type: "START_TURN_DAMAGE", value: 5, durationTurns: 5 },
    ],
  },

  /* =========================================================
     控制 / 压制
  ========================================================= */
  mohe_wuliang: {
    id: "mohe_wuliang",
    name: "摩诃无量",
    type: "CONTROL",
    target: "OPPONENT",
    effects: [
      { type: "DAMAGE", value: 10 },
      { type: "CONTROL", durationTurns: 1 },
    ],
  },

  shengsi_jie: {
    id: "shengsi_jie",
    name: "生死劫",
    type: "CONTROL",
    target: "OPPONENT",
    effects: [
      { type: "DAMAGE", value: 2 },
      { type: "CONTROL", durationTurns: 1 },
      { type: "HEAL_REDUCTION", value: 0.5, durationTurns: 3 },
    ],
  },

  chan_xiao: {
    id: "chan_xiao",
    name: "蟾啸",
    type: "CONTROL",
    target: "OPPONENT",
    effects: [
      { type: "DAMAGE", value: 10 },
      { type: "SILENCE", durationTurns: 1 },
    ],
  },

  /* =========================================================
     解控 / 防御（✅ 可在受控状态下使用）
  ========================================================= */
  jiru_feng: {
    id: "jiru_feng",
    name: "疾如风",
    type: "SUPPORT",
    target: "SELF",
    effects: [
      { type: "CLEANSE", allowWhileControlled: true },
      { type: "DRAW", value: 2, allowWhileControlled: true },
    ],
  },

  sanliu_xia: {
    id: "sanliu_xia",
    name: "散流霞",
    type: "SUPPORT",
    target: "SELF",
    effects: [
      { type: "CLEANSE", allowWhileControlled: true },
      { type: "DRAW", value: 1, allowWhileControlled: true },
      { type: "HEAL", value: 10, allowWhileControlled: true },
      {
        type: "UNTARGETABLE",
        durationTurns: 1,
        breakOnPlay: true,
        allowWhileControlled: true,
      },
    ],
  },

  que_ta_zhi: {
    id: "que_ta_zhi",
    name: "鹊踏枝",
    type: "SUPPORT",
    target: "SELF",
    effects: [
      { type: "CLEANSE", allowWhileControlled: true },
      { type: "CONTROL_IMMUNE", durationTurns: 1, allowWhileControlled: true },
      { type: "DODGE_NEXT", chance: 0.7, durationTurns: 1, allowWhileControlled: true },
    ],
  },

  /* =========================================================
     生存 / 回复
  ========================================================= */
  fengxiu_diang: {
    id: "fengxiu_diang",
    name: "风袖低昂",
    type: "SUPPORT",
    target: "SELF",
    effects: [
      { type: "HEAL", value: 60 },
      { type: "DAMAGE_REDUCTION", value: 0.5, durationTurns: 2 },
    ],
  },

  /* =========================================================
     特殊（可在受控状态下使用）
     ✅ Stealth (target-avoid only), NOT Untargetable
  ========================================================= */
  anchen_misan: {
    id: "anchen_misan",
    name: "暗尘弥散",
    type: "SUPPORT",
    target: "SELF",
    effects: [
      { type: "DRAW", value: 2, allowWhileControlled: true },
      {
        type: "STEALTH",
        durationTurns: 1,
        breakOnPlay: true,
        allowWhileControlled: true,
      },
    ],
  },

  /* =========================================================
     持续伤害 / 节奏压制 ✅ CHANNEL
  ========================================================= */
  fenglai_wushan: {
    id: "fenglai_wushan",
    name: "风来吴山",
    type: "CHANNEL",
    target: "SELF",
    effects: [
      { type: "FENGLAI_CHANNEL", durationTurns: 1, breakOnPlay: true },
      { type: "CONTROL_IMMUNE", durationTurns: 1, breakOnPlay: true },
    ],
  },

  wu_jianyu: {
    id: "wu_jianyu",
    name: "无间狱",
    type: "CHANNEL",
    target: "SELF",
    effects: [{ type: "WUJIAN_CHANNEL", durationTurns: 1, breakOnPlay: true }],
  },

  /* =========================================================
     强化状态 / 爆发
  ========================================================= */
  nuwa_butian: {
    id: "nuwa_butian",
    name: "女娲补天",
    type: "STANCE",
    target: "SELF",
    effects: [
      { type: "DAMAGE_MULTIPLIER", value: 2, durationTurns: 1 },
      { type: "DAMAGE_REDUCTION", value: 0.5, durationTurns: 1 },
    ],
  },

  /* =========================================================
     ================= PATCH 0.3 新卡 =================
  ========================================================= */

  /* 浮光掠影：
     - 隐身 4 回合（breakOnPlay：自己出牌就解除）
     - 下回合抽卡 -1（同样 breakOnPlay：出牌就解除）
  */
  fuguang_lueying: {
    id: "fuguang_lueying",
    name: "浮光掠影",
    type: "SUPPORT",
    target: "SELF",
    effects: [
      { type: "STEALTH", durationTurns: 4, breakOnPlay: true },
      { type: "DRAW_REDUCTION", value: 1, durationTurns: 2, breakOnPlay: true },
    ],
  },

  /* 绛唇珠袖：
     - 给目标挂一个状态：目标每次使用卡牌，受到 5 点伤害（持续 3 回合）
  */
  jiangchun_zhuxiu: {
    id: "jiangchun_zhuxiu",
    name: "绛唇珠袖",
    type: "CONTROL",
    target: "OPPONENT",
    effects: [
      { type: "ON_PLAY_DAMAGE", value: 3, durationTurns: 3 },
    ],
  },

  /* 大狮子吼：
     - 眩晕 1 回合
     - 下回合抽卡 -1
  */
  da_shizi_hou: {
    id: "da_shizi_hou",
    name: "大狮子吼",
    type: "CONTROL",
    target: "OPPONENT",
    effects: [
      { type: "CONTROL", durationTurns: 1 },
      { type: "DRAW_REDUCTION", value: 1, durationTurns: 1 },
    ],
  },

  /* 穹隆化生：
     - 抽 2
     - 回 10
     - 免控 4 回合
  */
  qionglong_huasheng: {
    id: "qionglong_huasheng",
    name: "穹隆化生",
    type: "SUPPORT",
    target: "SELF",
    effects: [
      { type: "DRAW", value: 2 },
      { type: "HEAL", value: 10 },
      { type: "CONTROL_IMMUNE", durationTurns: 2 },
    ],
  },

  /* 踏星行（ID 注意：taxingxing）：
     - 抽 2
     - 获得 60% 闪避（2 回合）
  */
  taxingxing: {
    id: "taxingxing",
    name: "踏星行",
    type: "SUPPORT",
    target: "SELF",
    effects: [
      { type: "DRAW", value: 2 },
      { type: "DODGE_NEXT", chance: 0.6, durationTurns: 2 },
    ],
  },

  /* 追命箭：
     - 造成 15 伤害
     - 命中时若目标血量 > 70，额外 5 伤害
  */
  zhuiming_jian: {
    id: "zhuiming_jian",
    name: "追命箭",
    type: "ATTACK",
    target: "OPPONENT",
    effects: [
      { type: "DAMAGE", value: 15 },
      { type: "BONUS_DAMAGE_IF_TARGET_HP_GT", value: 5, threshold: 70 },
    ],
  },

  /* 心诤：
     - 持续运功：期间免疫控制
     - 自己回合结束：对目标造成 5
     - 目标回合开始：对目标造成 5
     - 目标回合结束：运功结束，对目标造成 15
  */
  xinzheng: {
    id: "xinzheng",
    name: "心诤",
    type: "CHANNEL",
    target: "SELF",
    effects: [
      { type: "XINZHENG_CHANNEL", durationTurns: 2, breakOnPlay: true },
      { type: "CONTROL_IMMUNE", durationTurns: 2, breakOnPlay: true },
    ],
  },

  /* 天地无极：
     - 对目标造成 3
     - 自己隐身 1 回合
  */
 tiandi_wuji: {
  id: "tiandi_wuji",
  name: "天地无极",
  type: "ATTACK",
  target: "OPPONENT",
  effects: [
    { type: "DAMAGE", value: 5 },
    {
      type: "STEALTH",
      durationTurns: 1,
      breakOnPlay: true,   // ✅ FIX: 与所有 Stealth 统一
      applyTo: "SELF",
    },
  ],
},

  /* 驱夜断愁（文本已按你要求变更为：造成5点伤害，回复3点生命值）：
     - 对目标造成 5
     - 自己回复 3
  */
  quye_duanchou: {
    id: "quye_duanchou",
    name: "驱夜断愁",
    type: "ATTACK",
    target: "OPPONENT",
    effects: [
      { type: "DAMAGE", value: 4 },
      { type: "HEAL", value: 2, applyTo: "SELF" },
    ],
  },
};
