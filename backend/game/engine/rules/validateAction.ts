// backend/game/engine/validateAction.ts

import { GameState } from "../state/types";
import { CARDS } from "../../cards/cards";

/* =========================================================
   VALIDATE PLAY CARD
   - Target resolved by backend service
   - Validation only checks legality of play
   - Throws STABLE error codes for frontend mapping
========================================================= */
export function validatePlayCard(
  state: GameState,
  playerIndex: number,
  cardInstanceId: string
) {
  /* ================= GAME STATE ================= */
  if (state.gameOver) {
    throw new Error("ERR_GAME_OVER");
  }

  if (state.activePlayerIndex !== playerIndex) {
    throw new Error("ERR_NOT_YOUR_TURN");
  }

  const player = state.players[playerIndex];

  /* ================= CARD OWNERSHIP ================= */
  const instance = player.hand.find((c) => c.instanceId === cardInstanceId);
  if (!instance) {
    throw new Error("ERR_CARD_NOT_IN_HAND");
  }

  const card = CARDS[instance.cardId];
  if (!card) {
    throw new Error("ERR_CARD_NOT_FOUND");
  }

  /* ================= SILENCE ================= */
  const isSilenced = player.statuses.some((s) => s.type === "SILENCE");
  if (isSilenced) {
    throw new Error("ERR_SILENCED");
  }

  /* ================= CONTROL ================= */
  const isControlled = player.statuses.some(
    (s) => s.type === "CONTROL" || s.type === "ATTACK_LOCK"
  );
  const allowsOverride = card.effects.some((e) => e.allowWhileControlled === true);

  if (isControlled && !allowsOverride) {
    throw new Error("ERR_CONTROLLED");
  }

  // ❌ NO TARGET VALIDATION HERE
  // Target legality (e.g. UNTARGETABLE / STEALTH) is handled in gameService.playCard
}
