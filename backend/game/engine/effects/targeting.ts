

import { GameState, TargetType, Status } from "../state/types";

export function getEnemy(state: GameState, playerIndex: number) {
  return state.players[playerIndex === 0 ? 1 : 0];
}

export function resolveEffectTargetIndex(
  cardTargetIndex: number,
  playerIndex: number,
  applyTo: TargetType | undefined
) {
  if (!applyTo) return cardTargetIndex;
  return applyTo === "SELF" ? playerIndex : playerIndex === 0 ? 1 : 0;
}

export function hasUntargetable(p: { statuses: Status[] }) {
  return p.statuses.some((s) => s.type === "UNTARGETABLE");
}
