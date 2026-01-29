import { applyEffects } from "./applyEffects";
import { resolveTurnEnd } from "./turnResolver";
import { CARDS } from "../cards/cards";
import { GameState, Status } from "./types";

function log(title: string, value: any) {
  console.log(`${title}:`, value);
}

function createBaseState(): GameState {
  return {
    turn: 0,
    activePlayerIndex: 0,
    deck: [],
    discard: [],
    players: [
      {
        userId: "A",
        hp: 100,
        hand: ["strike", "heal_dr", "channel"],
        statuses: []
      },
      {
        userId: "B",
        hp: 100,
        hand: [],
        statuses: []
      }
    ]
  };
}

/* TEST 1 — NORMAL DAMAGE */
(() => {
  const state = createBaseState();
  applyEffects(state, CARDS.strike, 0, 1);
  resolveTurnEnd(state);
  log("TEST 1 (expect 90)", state.players[1].hp);
})();

/* TEST 2 — DAMAGE REDUCTION */
(() => {
  const state = createBaseState();
  const dr: Status = {
    type: "DAMAGE_REDUCTION",
    value: 0.4,
    appliedAtTurn: state.turn,
    expiresAtTurn: 10
  };
  state.players[1].statuses.push(dr);

  applyEffects(state, CARDS.strike, 0, 1);
  resolveTurnEnd(state);
  log("TEST 2 (expect 94)", state.players[1].hp);
})();

/* TEST 3 — DAMAGE MULTIPLIER */
(() => {
  const state = createBaseState();
  const buff: Status = {
    type: "DAMAGE_MULTIPLIER",
    value: 2,
    appliedAtTurn: state.turn,
    expiresAtTurn: 10
  };
  state.players[0].statuses.push(buff);

  applyEffects(state, CARDS.strike, 0, 1);
  resolveTurnEnd(state);
  log("TEST 3 (expect 80)", state.players[1].hp);
})();

/* TEST 4 — BURST */
(() => {
  const state = createBaseState();

  state.players[0].statuses.push({
    type: "DAMAGE_MULTIPLIER",
    value: 2,
    appliedAtTurn: state.turn,
    expiresAtTurn: 10
  });

  state.players[1].statuses.push({
    type: "DAMAGE_REDUCTION",
    value: 0.4,
    appliedAtTurn: state.turn,
    expiresAtTurn: 10
  });

  applyEffects(state, CARDS.strike, 0, 1);
  resolveTurnEnd(state);
  log("TEST 4 (expect 88)", state.players[1].hp);
})();

/* TEST 5 — HEAL CAP */
(() => {
  const state = createBaseState();
  state.players[0].hp = 90;

  applyEffects(state, CARDS.heal_dr, 0, 0);
  resolveTurnEnd(state);
  log("TEST 5 (expect 100)", state.players[0].hp);
})();

/* TEST 6 — DELAYED DAMAGE (CHANNEL)
   Channel does 10 immediate (100->90),
   delayed tick should NOT happen same turn,
   so after resolveTurnEnd it should still be 90.
*/
(() => {
  const state = createBaseState();

  applyEffects(state, CARDS.channel, 0, 1);
  resolveTurnEnd(state);

  log("TEST 6 (expect 90)", state.players[1].hp);
})();

/* TEST 7 — TURN ROTATION */
(() => {
  const state = createBaseState();
  resolveTurnEnd(state);
  log("TEST 7 (expect 1)", state.activePlayerIndex);
})();
