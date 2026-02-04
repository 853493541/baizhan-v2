// in-game/statusBar/buffRegistry.ts

export type BuffCategory = "BUFF" | "DEBUFF";

export interface BuffDefinition {
  name: string;
  category: BuffCategory;
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
 */
export const BUFF_REGISTRY: Record<string, BuffDefinition> = {
  /* =========================================================
     生死劫
  ========================================================= */
  "shengsi_jie:CONTROL": {
    name: "眩晕",
    category: "DEBUFF",
    description: () => `无法行动`,
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
    description: () => `倒在地上，无法行动`,
  },

  /* =========================================================
     大狮子吼
  ========================================================= */
  "da_shizi_hou:CONTROL": {
    name: "眩晕",
    category: "DEBUFF",
    description: () => `无法行动`,
  },

  "da_shizi_hou:DRAW_REDUCTION": {
    name: "抽卡受限",
    category: "DEBUFF",
    description: ({ value }) =>
      `下回合抽卡数量减少 ${value ?? 0}`,
  },

  /* =========================================================
     蟾啸
  ========================================================= */
  "chan_xiao:SILENCE": {
    name: "沉默",
    category: "DEBUFF",
    description: () => `无法使用任何卡牌`,
  },

  /* =========================================================
     百足
  ========================================================= */
  "baizu:START_TURN_DAMAGE": {
    name: "百足",
    category: "DEBUFF",
    description: ({ value }) =>
      `回合开始时受到 ${value ?? 0} 点伤害`,
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
     散流霞
  ========================================================= */
  "sanliu_xia:UNTARGETABLE": {
    name: "不可选中",
    category: "BUFF",
    description: () => `无法成为卡牌目标`,
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
      `下次受到伤害有 ${Math.round((chance ?? 0) * 100)}% 概率闪避`,
  },

  /* =========================================================
     暗尘弥散
  ========================================================= */
  "anchen_misan:STEALTH": {
    name: "隐身",
    category: "BUFF",
    description: () => `无法被指定为卡牌目标`,
  },

  /* =========================================================
     浮光掠影 ✅ FIX
  ========================================================= */
  "fuguang_lueying:STEALTH": {
    name: "隐身",
    category: "BUFF",
    description: () => `无法被指定为卡牌目标`,
  },

  "fuguang_lueying:DRAW_REDUCTION": {
    name: "抽卡受限",
    category: "DEBUFF",
    description: ({ value }) =>
      `下回合抽卡数量减少 ${value ?? 0}`,
  },

  /* =========================================================
     风来吴山
  ========================================================= */
  "fenglai_wushan:FENGLAI_CHANNEL": {
    name: "风来吴山",
    category: "BUFF",
    description: () =>
      `持续运功：在任意玩家回合开始与结束时对敌方造成伤害`,
  },

  "fenglai_wushan:CONTROL_IMMUNE": {
    name: "免控",
    category: "BUFF",
    description: () => `运功期间免疫控制效果`,
  },

  /* =========================================================
     无间狱
  ========================================================= */
  "wu_jianyu:WUJIAN_CHANNEL": {
    name: "无间狱",
    category: "BUFF",
    description: () =>
      `修罗附体：多段伤害并吸取生命`,
  },

  /* =========================================================
     女娲补天
  ========================================================= */
  "nuwa_butian:DAMAGE_MULTIPLIER": {
    name: "女娲",
    category: "BUFF",
    description: () => `造成伤害提高100%`,
  },

  "nuwa_butian:DAMAGE_REDUCTION": {
    name: "减伤",
    category: "BUFF",
    description: ({ value }) =>
      `受到伤害降低 ${Math.round((value ?? 0) * 100)}%`,
  },

  /* =========================================================
     绛唇珠袖
  ========================================================= */
  "jiangchun_zhuxiu:ON_PLAY_DAMAGE": {
    name: "绛唇",
    category: "DEBUFF",
    description: ({ value }) =>
      `每次使用卡牌时受到 ${value ?? 0} 点伤害`,
  },

  /* =========================================================
     踏星行
  ========================================================= */
  "taxingxing:DODGE_NEXT": {
    name: "踏星",
    category: "BUFF",
    description: ({ chance }) =>
      `受到伤害时有 ${Math.round((chance ?? 0) * 100)}% 概率闪避`,
  },

  /* =========================================================
     穹隆化生
  ========================================================= */
  "qionglong_huasheng:CONTROL_IMMUNE": {
    name: "化生",
    category: "BUFF",
    description: () => `免疫控制效果`,
  },

  /* =========================================================
     心诤 ✅ FIX
  ========================================================= */
  "xinzheng:XINZHENG_CHANNEL": {
    name: "心诤",
    category: "BUFF",
    description: () =>
      `持续运功：在双方回合关键节点对目标造成伤害`,
  },

  "xinzheng:CONTROL_IMMUNE": {
    name: "免控",
    category: "BUFF",
    description: () => `运功期间免疫控制效果`,
  },

  /* =========================================================
     天地无极
  ========================================================= */
  "tiandi_wuji:STEALTH": {
    name: "隐身",
    category: "BUFF",
    description: () => `无法被指定为卡牌目标`,
  },
};
