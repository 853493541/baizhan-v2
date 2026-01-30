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
    name: "蝉啸",
    type: "CONTROL",
    target: "OPPONENT",
    effects: [
      { type: "DAMAGE", value: 10 },
      { type: "SILENCE", durationTurns: 1 },
      { type: "START_TURN_DAMAGE", value: 1, durationTurns: 3 },
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
      { type: "HEAL", value: 5, allowWhileControlled: true },
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
      {
        type: "CONTROL_IMMUNE",
        durationTurns: 1,
        allowWhileControlled: true,
      },
      {
        type: "DODGE_NEXT",
        chance: 0.7,
        durationTurns: 1,
        allowWhileControlled: true,
      },
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
      { type: "DAMAGE_REDUCTION", value: 0.4, durationTurns: 3 },
    ],
  },

  qiandie_turui: {
    id: "qiandie_turui",
    name: "千蝶吐瑞",
    type: "SUPPORT",
    target: "SELF",
    effects: [
      { type: "HEAL", value: 40 },
      {
        type: "START_TURN_HEAL",
        value: 30,
        durationTurns: 2,
        breakOnPlay: true,
      },
    ],
  },

  /* =========================================================
     特殊（可在受控状态下使用）
  ========================================================= */
  anchen_misan: {
    id: "anchen_misan",
    name: "暗尘弥散",
    type: "SUPPORT",
    target: "SELF",
    effects: [
      { type: "DRAW", value: 2, allowWhileControlled: true },
      {
        type: "UNTARGETABLE",
        durationTurns: 1,
        breakOnPlay: true,
        allowWhileControlled: true,
      },
    ],
  },

  /* =========================================================
     持续伤害 / 节奏压制
  ========================================================= */
  fenglai_wushan: {
    id: "fenglai_wushan",
    name: "风来吴山",
    type: "ATTACK",
    target: "OPPONENT",
    effects: [
      { type: "DAMAGE", value: 10 },
      {
        type: "START_TURN_DAMAGE",
        value: 10,
        durationTurns: 1,
        breakOnPlay: true,
      },
      {
        type: "DELAYED_DAMAGE",
        value: 10,
        repeatTurns: 1,
        breakOnPlay: true,
      },
    ],
  },

  wu_jianyu: {
    id: "wu_jianyu",
    name: "无间狱",
    type: "ATTACK",
    target: "OPPONENT",
    effects: [
      { type: "DELAYED_DAMAGE", value: 10, repeatTurns: 1 },
      { type: "START_TURN_DAMAGE", value: 15, durationTurns: 1 },
      { type: "START_TURN_HEAL", value: 5, durationTurns: 1 },
      { type: "DELAYED_DAMAGE", value: 15, repeatTurns: 1 },
      { type: "START_TURN_HEAL", value: 5, durationTurns: 1 },
    ],
  },

  baizu: {
    id: "baizu",
    name: "百足",
    type: "ATTACK",
    target: "OPPONENT",
    effects: [
      { type: "DAMAGE", value: 5 },
      { type: "START_TURN_DAMAGE", value: 3, durationTurns: 3 },
      { type: "START_TURN_DAMAGE", value: 5, durationTurns: 1 },
    ],
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
};
