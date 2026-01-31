// in-game/statusBar/buffRegistry.ts

export type BuffCategory = "BUFF" | "DEBUFF";

export interface BuffDefinition {
  /** Display name shown to user */
  name: string;

  /** BUFF or DEBUFF */
  category: BuffCategory;

  /** Description builder (uses runtime values) */
  description: (params: {
    value?: number;
    chance?: number;
    remainingTurns?: number;
    repeatTurns?: number;
  }) => string;
}

/**
 * Key format:
 * `${sourceCardId}:${effectType}`
 *
 * RULE:
 * - If a key exists here → use this name & description
 * - Otherwise → resolveBuff fallback handles naming
 */
export const BUFF_REGISTRY: Record<string, BuffDefinition> = {
  /* =========================================================
     生死劫
  ========================================================= */
  "shengsi_jie:CONTROL": {
    name: "眩晕",
    category: "DEBUFF",
    description: () => `眩晕。`,
  },

  "shengsi_jie:HEAL_REDUCTION": {
    name: "减疗",
    category: "DEBUFF",
    description: ({ value }) =>
      `受到治疗降低 ${Math.round((value ?? 0) * 100)}%`,
  },

  /* =========================================================
     摩诃无量
  ========================================================= */
  "mohe_wuliang:CONTROL": {
    name: "倒地",
    category: "DEBUFF",
    description: () => `倒在地上。`,
  },

  /* =========================================================
     蟾啸
  ========================================================= */
  "chan_xiao:SILENCE": {
    name: "沉默",
    category: "DEBUFF",
    description: () => `沉默`,
  },

  "chan_xiao:START_TURN_DAMAGE": {
    name: "DOT",
    category: "DEBUFF",
    description: ({ value }) =>
      `回合开始受到 ${value ?? 0} 点伤害`,
  },

  /* =========================================================
     百足
  ========================================================= */
  "baizu:START_TURN_DAMAGE": {
    name: "DOT",
    category: "DEBUFF",
    description: ({ value }) =>
      `回合开始受到 ${value ?? 0} 点伤害`,
  },

  /* =========================================================
     风袖低昂
  ========================================================= */
  "fengxiu_diang:DAMAGE_REDUCTION": {
    name: "风袖",
    category: "BUFF",
    description: ({ value }) =>
      `受到伤害降低 ${Math.round((value ?? 0) * 100)}%`,
  },

  /* =========================================================
     千蝶吐瑞
  ========================================================= */
  "qiandie_turui:START_TURN_HEAL": {
    name: "千蝶",
    category: "BUFF",
    description: ({ value }) =>
      `回合开始回复 ${value ?? 0} 点生命`,
  },

  /* =========================================================
     散流霞
  ========================================================= */
  "sanliu_xia:UNTARGETABLE": {
    name: "散",
    category: "BUFF",
    description: () => `不可被选中`,
  },

  /* =========================================================
     鹊踏枝
  ========================================================= */
  "que_ta_zhi:CONTROL_IMMUNE": {
    name: "免控",
    category: "BUFF",
    description: () => `免疫控制效果`,
  },

  "que_ta_zhi:DODGE_NEXT": {
    name: "闪避",
    category: "BUFF",
    description: ({ chance }) =>
      `下次受到攻击有 ${Math.round((chance ?? 0) * 100)}% 概率闪避`,
  },

  /* =========================================================
     暗尘弥散
  ========================================================= */
  "anchen_misan:UNTARGETABLE": {
    name: "隐身",
    category: "BUFF",
    description: () => `不可被选中`,
  },

  /* =========================================================
     女娲补天
  ========================================================= */
  "nuwa_butian:DAMAGE_MULTIPLIER": {
    name: "女娲",
    category: "BUFF",
    description: ({ value }) =>
      `造成伤害提高至 ${value ?? 1} 倍`,
  },

  "nuwa_butian:DAMAGE_REDUCTION": {
    name: "减伤",
    category: "BUFF",
    description: ({ value }) =>
      `受到伤害降低 ${Math.round((value ?? 0) * 100)}%`,
  },
};
