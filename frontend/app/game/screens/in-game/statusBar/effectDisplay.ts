// in-game/effectDisplay.ts

export type RuntimeEffect = {
  type: string;
  value?: number;
  chance?: number;
  remainingTurns?: number;
  repeatTurns?: number;
};

export const EFFECT_DISPLAY: Record<
  string,
  (e: RuntimeEffect) => string
> = {
  SILENCE: e => `沉默（${e.remainingTurns ?? 0} 回合）`,
  CONTROL_IMMUNE: e => `免疫控制（${e.remainingTurns ?? 0} 回合）`,
  UNTARGETABLE: e => `不可选中（${e.remainingTurns ?? 0} 回合）`,

  HEAL_REDUCTION: e =>
    `治疗降低 ${Math.round((e.value ?? 0) * 100)}%（${e.remainingTurns ?? 0} 回合）`,

  DAMAGE_REDUCTION: e =>
    `减伤 ${Math.round((e.value ?? 0) * 100)}%（${e.remainingTurns ?? 0} 回合）`,

  DAMAGE_MULTIPLIER: e =>
    `伤害 ×${e.value ?? 1}（${e.remainingTurns ?? 0} 回合）`,

  START_TURN_DAMAGE: e =>
    `回合开始受到 ${e.value ?? 0} 点伤害（${e.remainingTurns ?? 0} 回合）`,

  START_TURN_HEAL: e =>
    `回合开始回复 ${e.value ?? 0} 点生命（${e.remainingTurns ?? 0} 回合）`,

  DELAYED_DAMAGE: e =>
    `延迟造成 ${e.value ?? 0} 点伤害（${e.repeatTurns ?? 1} 次）`,

  DODGE_NEXT: e =>
    `下次伤害 ${Math.round((e.chance ?? 0) * 100)}% 闪避`,

  ATTACK_LOCK: e =>
    `攻击受限（${e.remainingTurns ?? 0} 回合）`,
};
