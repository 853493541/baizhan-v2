// backend/game/engine/types.ts

export type PlayerID = string;

export type CardType =
  | "ATTACK"
  | "SUPPORT"
  | "CONTROL"
  | "STANCE"
  | "CHANNEL";

export type TargetType = "SELF" | "OPPONENT";

export type EffectType =
  | "DAMAGE"
  | "HEAL"
  | "DRAW"
  | "DAMAGE_REDUCTION"
  | "DAMAGE_MULTIPLIER"
  | "HEAL_REDUCTION"
  | "UNTARGETABLE"
  | "STEALTH"
  | "ATTACK_LOCK"
  | "CONTROL"
  | "SILENCE"
  | "CONTROL_IMMUNE"
  | "DODGE_NEXT"
  | "DELAYED_DAMAGE"
  | "START_TURN_DAMAGE"
  | "START_TURN_HEAL"
  | "CLEANSE"
  | "FENGLAI_CHANNEL"
  | "WUJIAN_CHANNEL"
  /* ================= PATCH 0.3 ================= */
  | "DRAW_REDUCTION"          // next turn draw -N
  | "ON_PLAY_DAMAGE"          // if owner plays a card, take damage
  | "XINZHENG_CHANNEL"        // 心诤运功状态（caster buff）
  | "BONUS_DAMAGE_IF_TARGET_HP_GT"; // 追命箭：目标血量>阈值则额外伤害

/** For frontend display only */
export type EffectCategory = "BUFF" | "DEBUFF";

export interface CardEffect {
  type: EffectType;

  /** Common numeric value (damage/heal/draw/dr/hr/etc) */
  value?: number;

  /** Duration in turns (your existing expire rule uses +duration+1) */
  durationTurns?: number;

  /** For repeating effects (e.g., DELAYED_DAMAGE repeatTurns) */
  repeatTurns?: number;

  /** Chance for probabilistic effects (e.g., DODGE_NEXT) */
  chance?: number;

  /** If true, the status ends when THE OWNER plays a card */
  breakOnPlay?: boolean;

  /** If true, this effect allows the card to be played while CONTROLLED */
  allowWhileControlled?: boolean;

  /* ================= PATCH 0.3 =================
     Mixed targeting in a single card:
     - If omitted, defaults to card.target
     - If set, overrides per-effect target
  ================================================= */
  applyTo?: TargetType;

  /** BONUS_DAMAGE_IF_TARGET_HP_GT */
  threshold?: number;
}

export interface Card {
  id: string;
  name: string;
  type: CardType;
  target: TargetType;
  effects: CardEffect[];
}

export interface CardInstance {
  instanceId: string;
  cardId: string;
}

export type GameEventType =
  | "PLAY_CARD"
  | "END_TURN"
  | "DAMAGE"
  | "HEAL"
  | "STATUS_APPLIED";

export interface GameEvent {
  id: string;
  turn: number;
  type: GameEventType;
  actorUserId: PlayerID;
  targetUserId?: PlayerID;
  cardId?: string;
  cardName?: string;
  effectType?: EffectType;
  value?: number;
  statusType?: EffectType;
  appliedAtTurn?: number;
  expiresAtTurn?: number;
  timestamp: number;
}

export interface Status {
  type: EffectType;
  value?: number;
  sourceCardId?: string;
  sourceCardName?: string;
  category?: EffectCategory;
  appliedAtTurn: number;
  expiresAtTurn: number;
  repeatTurns?: number;
  chance?: number;
  breakOnPlay?: boolean;
}

export interface PlayerState {
  userId: PlayerID;
  hp: number;
  hand: CardInstance[];
  statuses: Status[];
}

export interface GameState {
  players: PlayerState[];
  deck: CardInstance[];
  discard: CardInstance[];
  turn: number;
  activePlayerIndex: number;
  gameOver: boolean;
  winnerUserId?: PlayerID;
  events: GameEvent[];
}
