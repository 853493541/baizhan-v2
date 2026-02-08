// backend/game/engine/effects/handlers.ts

import { GameState, Card } from "../state/types";
import { handleDamage } from "./handlers/handleDamage";
import { handleBonusDamageIfHpGt } from "./handlers/handleBonusDamageIfHpGt";
import { handleHeal } from "./handlers/handleHeal";
import { handleDraw } from "./handlers/handleDraw";
import { handleCleanse } from "./handlers/handleCleanse";
import { handleChannelEffect } from "./handlers/handleChannelEffect";
import { handleApplyBuffs } from "./handlers/handleApplyBuffs";

/**
 * PUBLIC EFFECT HANDLERS FACADE
 *
 * This file is the stable import boundary.
 * Do NOT put logic here.
 */

export {
  handleDamage,
  handleBonusDamageIfHpGt,
  handleHeal,
  handleDraw,
  handleCleanse,
  handleChannelEffect,
  handleApplyBuffs,
};
