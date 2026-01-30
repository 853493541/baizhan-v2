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
    name: "受控",
    category: "DEBUFF",
    description: ({ remainingTurns }) =>
      `无法使用部分卡牌，剩余 ${remainingTurns ?? 0} 回合`,
  },

  "shengsi_jie:HEAL_REDUCTION": {
    name: "减疗",
    category: "DEBUFF",
    description: ({ value, remainingTurns }) =>
      `受到治疗降低 ${Math.round((value ?? 0) * 100)}%，剩余 ${
        remainingTurns ?? 0
      } 回合`,
  },

  /* =========================================================
     摩诃无量
  ========================================================= */
  "mohe_wuliang:CONTROL": {
    name: "受控",
    category: "DEBUFF",
    description: ({ remainingTurns }) =>
      `无法使用部分卡牌，剩余 ${remainingTurns ?? 0} 回合`,
  },

  /* =========================================================
     蝉啸
  ========================================================= */
  "chan_xiao:SILENCE": {
    name: "沉默",
    category: "DEBUFF",
    description: ({ remainingTurns }) =>
      `无法使用任何卡牌，剩余 ${remainingTurns ?? 0} 回合`,
  },

  "chan_xiao:START_TURN_DAMAGE": {
    name: "持续伤害",
    category: "DEBUFF",
    description: ({ value, remainingTurns }) =>
      `回合开始受到 ${value ?? 0} 点伤害，剩余 ${remainingTurns ?? 0} 回合`,
  },

  /* =========================================================
     百足
  ========================================================= */
  "baizu:START_TURN_DAMAGE": {
    name: "持续伤害",
    category: "DEBUFF",
    description: ({ value, remainingTurns }) =>
      `回合开始受到 ${value ?? 0} 点伤害，剩余 ${remainingTurns ?? 0} 回合`,
  },

  /* =========================================================
     风袖低昂
  ========================================================= */
  "fengxiu_diang:DAMAGE_REDUCTION": {
    name: "减伤",
    category: "BUFF",
    description: ({ value, remainingTurns }) =>
      `受到伤害降低 ${Math.round((value ?? 0) * 100)}%，剩余 ${
        remainingTurns ?? 0
      } 回合`,
  },

  /* =========================================================
     千蝶吐瑞
  ========================================================= */
  "qiandie_turui:START_TURN_HEAL": {
    name: "千蝶",
    category: "BUFF",
    description: ({ value, remainingTurns }) =>
      `回合开始回复 ${value ?? 0} 点生命，剩余 ${remainingTurns ?? 0} 回合`,
  },

  /* =========================================================
     散流霞
  ========================================================= */
  "sanliu_xia:UNTARGETABLE": {
    name: "不可选中",
    category: "BUFF",
    description: ({ remainingTurns }) =>
      `不可被选中，剩余 ${remainingTurns ?? 0} 回合`,
  },

  /* =========================================================
     鹊踏枝
  ========================================================= */
  "que_ta_zhi:CONTROL_IMMUNE": {
    name: "免控",
    category: "BUFF",
    description: ({ remainingTurns }) =>
      `免疫控制效果，剩余 ${remainingTurns ?? 0} 回合`,
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
    description: ({ remainingTurns }) =>
      `不可被选中，剩余 ${remainingTurns ?? 0} 回合`,
  },

  /* =========================================================
     女娲补天
  ========================================================= */
  "nuwa_butian:DAMAGE_MULTIPLIER": {
    name: "爆发",
    category: "BUFF",
    description: ({ value, remainingTurns }) =>
      `造成伤害提高至 ${value ?? 1} 倍，剩余 ${remainingTurns ?? 0} 回合`,
  },

  "nuwa_butian:DAMAGE_REDUCTION": {
    name: "女娲",
    category: "BUFF",
    description: ({ value, remainingTurns }) =>
      `受到伤害降低 ${Math.round((value ?? 0) * 100)}%，剩余 ${
        remainingTurns ?? 0
      } 回合`,
  },
};
