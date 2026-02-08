// backend/game/engine/state/types/cards.ts

import { CardEffect } from "./effects";
import { BuffDefinition } from "./buffs";

export type CardType =
  | "ATTACK"
  | "SUPPORT"
  | "CONTROL"
  | "STANCE"
  | "CHANNEL";

export type TargetType = "SELF" | "OPPONENT";

export interface Card {
  id: string;
  name: string;
  type: CardType;
  target: TargetType;

  /**
   * GCD cost to play this card
   *
   * Rules (v0):
   * - Player must have gcd >= gcdCost to play
   * - Playing the card consumes gcdCost
   * - Each player currently gets 1 GCD per turn
   */
  gcdCost: number;

  effects: CardEffect[];
  buffs?: BuffDefinition[];

  /**
   * Original design / source description (not shown to players)
   * Used for dev reference and future card versioning
   */
  originalDescription?: string;
}

export interface CardInstance {
  instanceId: string;
  cardId: string;
}
