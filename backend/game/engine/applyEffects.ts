import { randomUUID } from "crypto";
import { GameState, Card, Status, GameEvent } from "./types";

function pushEvent(state: GameState, e: Omit<GameEvent, "id" | "timestamp">) {
  state.events.push({
    id: randomUUID(),
    timestamp: Date.now(),
    ...e,
  });
}

export function applyEffects(
  state: GameState,
  card: Card,
  playerIndex: number,
  targetIndex: number
) {
  if (state.gameOver) return;

  const source = state.players[playerIndex];
  const target = state.players[targetIndex];
  const statusTarget = card.target === "SELF" ? source : target;

  // Break statuses that end when playing a card
  source.statuses = source.statuses.filter((s) => !s.breakOnPlay);
  target.statuses = target.statuses.filter((s) => !s.breakOnPlay);

  for (const effect of card.effects) {
    switch (effect.type) {
      case "DAMAGE": {
        let damage = effect.value ?? 0;

        const dmgBoost = source.statuses.find(
          (s) => s.type === "DAMAGE_MULTIPLIER"
        );
        if (dmgBoost) damage *= dmgBoost.value ?? 1;

        const dr = target.statuses.find(
          (s) => s.type === "DAMAGE_REDUCTION"
        );
        if (dr) damage *= 1 - (dr.value ?? 0);

        const finalDamage = Math.floor(damage);
        target.hp = Math.max(0, target.hp - finalDamage);

        if (finalDamage !== 0) {
          pushEvent(state, {
            turn: state.turn,
            type: "DAMAGE",
            actorUserId: source.userId,
            targetUserId: target.userId,
            cardId: card.id,
            cardName: card.name,
            effectType: "DAMAGE",
            value: finalDamage,
          });
        }
        break;
      }

      case "HEAL": {
        let heal = effect.value ?? 0;

        const hr = source.statuses.find(
          (s) => s.type === "HEAL_REDUCTION"
        );
        if (hr) heal *= 1 - (hr.value ?? 0);

        const finalHeal = Math.floor(heal);
        const before = source.hp;
        source.hp = Math.min(100, source.hp + finalHeal);
        const appliedHeal = Math.max(0, source.hp - before);

        if (appliedHeal !== 0) {
          pushEvent(state, {
            turn: state.turn,
            type: "HEAL",
            actorUserId: source.userId,
            targetUserId: source.userId,
            cardId: card.id,
            cardName: card.name,
            effectType: "HEAL",
            value: appliedHeal,
          });
        }
        break;
      }

      case "DRAW": {
        for (let i = 0; i < (effect.value ?? 0); i++) {
          const cardDrawn = state.deck.shift();
          if (cardDrawn) source.hand.push(cardDrawn);
        }
        break;
      }

      case "CLEANSE": {
        source.statuses = source.statuses.filter(
          (s) => s.type !== "CONTROL"
        );
        break;
      }

      default: {
        if (!effect.durationTurns) break;

        // 🔁 REFRESH LOGIC: remove existing same-type status
        statusTarget.statuses = statusTarget.statuses.filter(
          (s) => s.type !== effect.type
        );

        const status: Status = {
          type: effect.type,
          value: effect.value,
          appliedAtTurn: state.turn,
          expiresAtTurn: state.turn + effect.durationTurns,
          repeatTurns: effect.repeatTurns,
          chance: effect.chance,
          breakOnPlay: effect.breakOnPlay,
          sourceCardId: card.id,
          sourceCardName: card.name,
        };

        statusTarget.statuses.push(status);

        pushEvent(state, {
          turn: state.turn,
          type: "STATUS_APPLIED",
          actorUserId: source.userId,
          targetUserId: statusTarget.userId,
          cardId: card.id,
          cardName: card.name,
          statusType: status.type,
          effectType: status.type,
          value: status.value,
          appliedAtTurn: status.appliedAtTurn,
          expiresAtTurn: status.expiresAtTurn,
        });
      }
    }
  }

  checkEndGame(state);
}

function checkEndGame(state: GameState) {
  for (const player of state.players) {
    if (player.hp <= 0) {
      state.gameOver = true;
      const winner = state.players.find(
        (p) => p.userId !== player.userId
      );
      state.winnerUserId = winner?.userId;
      return;
    }
  }
}
