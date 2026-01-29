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

  const statusTarget =
    card.target === "SELF" ? source : target;

  for (const effect of card.effects) {
    switch (effect.type) {
      case "DAMAGE": {
        let damage = effect.value ?? 0;

        const dmgBoost = source.statuses.find(
          s => s.type === "DAMAGE_MULTIPLIER"
        );
        if (dmgBoost) {
          damage *= dmgBoost.value ?? 1;
        }

        const dr = target.statuses.find(
          s => s.type === "DAMAGE_REDUCTION"
        );
        if (dr) {
          damage *= 1 - (dr.value ?? 0);
        }

        target.hp = Math.max(0, target.hp - Math.floor(damage));
        break;
      }

      case "HEAL":
        source.hp = Math.min(100, source.hp + (effect.value ?? 0));
        break;

      case "DELAYED_DAMAGE": {
        const status: Status = {
          type: "DELAYED_DAMAGE",
          value: effect.value,
          repeatTurns: effect.repeatTurns ?? 1,
          appliedAtTurn: state.turn,
          expiresAtTurn: state.turn + (effect.repeatTurns ?? 1)
        };
        target.statuses.push(status);
        break;
      }

      default: {
        if (effect.durationTurns) {
          const status: Status = {
            type: effect.type,
            value: effect.value,
            appliedAtTurn: state.turn,
            expiresAtTurn: state.turn + effect.durationTurns
          };
          statusTarget.statuses.push(status);
        }
      }
    }
  }

  checkEndGame(state);
}

function checkEndGame(state: GameState) {
  for (const player of state.players) {
    if (player.hp <= 0) {
      state.gameOver = true;
      const winner = state.players.find(p => p.userId !== player.userId);
      state.winnerUserId = winner?.userId;
      return;
    }
  }
}
