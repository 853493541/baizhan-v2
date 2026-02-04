

import { randomUUID } from "crypto";
import { GameState, Card, Status, EffectType, GameEvent } from "../state/types";
import { getEffectCategory } from "./categories";

function pushEvent(state: GameState, e: Omit<GameEvent, "id" | "timestamp">) {
  state.events.push({
    id: randomUUID(),
    timestamp: Date.now(),
    ...e,
  });
}

export function addStatus(params: {
  state: GameState;
  sourceUserId: string;
  targetUserId: string;
  card: Card;
  statusTarget: { userId: string; statuses: Status[] };
  type: EffectType;
  value?: number;
  durationTurns: number;
  repeatTurns?: number;
  chance?: number;
  breakOnPlay?: boolean;
}) {
  const {
    state,
    sourceUserId,
    targetUserId,
    card,
    statusTarget,
    type,
    value,
    durationTurns,
    repeatTurns,
    chance,
    breakOnPlay,
  } = params;

  // refresh same-type
  statusTarget.statuses = statusTarget.statuses.filter((s) => s.type !== type);

  const status: Status = {
    type,
    value,
    appliedAtTurn: state.turn,
    expiresAtTurn: state.turn + durationTurns + 1,
    repeatTurns,
    chance,
    breakOnPlay,
    sourceCardId: card.id,
    sourceCardName: card.name,
    category: getEffectCategory(type),
  };

  statusTarget.statuses.push(status);

  pushEvent(state, {
    turn: state.turn,
    type: "STATUS_APPLIED",
    actorUserId: sourceUserId,
    targetUserId,
    cardId: card.id,
    cardName: card.name,
    statusType: type,
    appliedAtTurn: status.appliedAtTurn,
    expiresAtTurn: status.expiresAtTurn,
  });
}
