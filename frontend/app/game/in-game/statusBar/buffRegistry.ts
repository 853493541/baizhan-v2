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
 */
export const BUFF_REGISTRY: Record<string, BuffDefinition> = {
  /* ================= 生死劫 ================= */
  "shengsi_jie:HEAL_REDUCTION": {
    name: "月劫",
    category: "DEBUFF",
    description: ({ value, remainingTurns }) =>
      `受到治疗降低 ${Math.round((value ?? 0) * 100)}%，剩余 ${remainingTurns ?? 0} 回合`,
  },

  /* ================= 百足 ================= */
  "baizu:START_TURN_DAMAGE": {
    name: "百足",
    category: "DEBUFF",
    description: ({ value, remainingTurns }) =>
      `回合开始受到 ${value ?? 0} 点伤害，剩余 ${remainingTurns ?? 0} 回合`,
  },

  /* ================= 风袖低昂 ================= */
  "fengxiu_diang:DAMAGE_REDUCTION": {
    name: "风袖低昂",
    category: "BUFF",
    description: ({ value, remainingTurns }) =>
      `受到伤害降低 ${Math.round((value ?? 0) * 100)}%，剩余 ${remainingTurns ?? 0} 回合`,
  },
};
