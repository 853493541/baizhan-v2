// backend/game/engine/rules/validateAction.ts

import { GameState } from "../state/types";
import { CARDS } from "../../cards/cards";
import { blocksCardTargeting } from "./guards";

/* =========================================================
   INTERNAL HELPERS
========================================================= */

function hasEffect(player: { buffs: any[] }, type: string) {
  return player.buffs.some((b: any) =>
    b.effects.some((e: any) => e.type === type)
  );
}

/* =========================================================
   VALIDATE PLAY CARD
========================================================= */

export function validatePlayCard(
  state: GameState,
  playerIndex: number,
  cardInstanceId: string
) {
  if (state.gameOver) {
    throw new Error("ERR_GAME_OVER");
  }

  if (state.activePlayerIndex !== playerIndex) {
    throw new Error("ERR_NOT_YOUR_TURN");
  }

  const player = state.players[playerIndex];

  const instance = player.hand.find((c) => c.instanceId === cardInstanceId);
  if (!instance) {
    throw new Error("ERR_CARD_NOT_IN_HAND");
  }

  const card = CARDS[instance.cardId];
  if (!card) {
    throw new Error("ERR_CARD_NOT_FOUND");
  }

  /* ================= SILENCE ================= */

  if (hasEffect(player, "SILENCE")) {
    throw new Error("ERR_SILENCED");
  }

  /* ================= CONTROL / ATTACK_LOCK ================= */

  const isControlled =
    hasEffect(player, "CONTROL") || hasEffect(player, "ATTACK_LOCK");

  const allowsOverride =
    Array.isArray(card.effects) &&
    card.effects.some((e) => e.allowWhileControlled === true);

  if (isControlled && !allowsOverride) {
    throw new Error("ERR_CONTROLLED");
  }

  /* ================= TARGETING (STEALTH / UNTARGETABLE) ================= */

  // Only applies to opponent-targeted cards
  if (card.target === "OPPONENT") {
    const enemyIndex = playerIndex === 0 ? 1 : 0;
    const enemy = state.players[enemyIndex];

    if (blocksCardTargeting(enemy)) {
      throw new Error("ERR_TARGET_UNAVAILABLE");
    }
  }

  // ✅ All validations passed
}
