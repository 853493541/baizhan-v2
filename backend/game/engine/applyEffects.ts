// backend/game/engine/applyEffects.ts
import { GameState, Card, Status } from "./types";

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

  // 🔥 Break statuses that end when playing a card
  source.statuses = source.statuses.filter(s => !s.breakOnPlay);
  target.statuses = target.statuses.filter(s => !s.breakOnPlay);

  for (const effect of card.effects) {
    switch (effect.type) {
      case "DAMAGE": {
        let damage = effect.value ?? 0;

        const dmgBoost = source.statuses.find(
          s => s.type === "DAMAGE_MULTIPLIER"
        );
        if (dmgBoost) damage *= dmgBoost.value ?? 1;

        const dr = target.statuses.find(
          s => s.type === "DAMAGE_REDUCTION"
        );
        if (dr) damage *= 1 - (dr.value ?? 0);

        const dodge = target.statuses.find(
          s => s.type === "DODGE_NEXT"
        );
        if (dodge && Math.random() < (dodge.chance ?? 0)) {
          target.statuses = target.statuses.filter(s => s !== dodge);
          break;
        }

        target.hp = Math.max(0, target.hp - Math.floor(damage));
        break;
      }

      case "HEAL": {
        let heal = effect.value ?? 0;
        const hr = source.statuses.find(
          s => s.type === "HEAL_REDUCTION"
        );
        if (hr) heal *= 1 - (hr.value ?? 0);
        source.hp = Math.min(100, source.hp + Math.floor(heal));
        break;
      }

      case "DRAW":
        for (let i = 0; i < (effect.value ?? 0); i++) {
          const card = state.deck.shift();
          if (card) source.hand.push(card);
        }
        break;

      case "CLEANSE":
        source.statuses = source.statuses.filter(
          s =>
            !["SILENCE", "ATTACK_LOCK", "DELAYED_DAMAGE"].includes(s.type)
        );
        break;

      default: {
        if (!effect.durationTurns) break;

        const status: Status = {
          type: effect.type,
          value: effect.value,
          appliedAtTurn: state.turn,
          expiresAtTurn: state.turn + effect.durationTurns,
          repeatTurns: effect.repeatTurns,
          chance: effect.chance,
          breakOnPlay: effect.breakOnPlay,
        };

        statusTarget.statuses.push(status);
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
        p => p.userId !== player.userId
      );
      state.winnerUserId = winner?.userId;
      return;
    }
  }
}
