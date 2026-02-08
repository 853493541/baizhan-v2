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
  effects: CardEffect[];
  buffs?: BuffDefinition[];
  originalDescription?: string;
}

export interface CardInstance {
  instanceId: string;
  cardId: string;
}
