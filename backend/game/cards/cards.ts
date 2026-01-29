// backend/game/cards/cards.ts
import { Card } from "../engine/types";

export const CARDS: Record<string, Card> = {
  strike: {
    id: "strike",
    name: "Strike",
    type: "ATTACK",
    target: "OPPONENT",
    effects: [{ type: "DAMAGE", value: 10 }]
  },

  heal_dr: {
    id: "heal_dr",
    name: "Emergency Aid",
    type: "SUPPORT",
    target: "SELF",
    effects: [
      { type: "HEAL", value: 60 },
      { type: "DAMAGE_REDUCTION", value: 0.4, durationTurns: 1 }
    ]
  },

  disengage: {
    id: "disengage",
    name: "Disengage",
    type: "SUPPORT",
    target: "SELF",
    effects: [
      { type: "UNTARGETABLE", durationTurns: 1 },
      { type: "ATTACK_LOCK", durationTurns: 1 }
    ]
  },

  power_surge: {
    id: "power_surge",
    name: "Power Surge",
    type: "STANCE",
    target: "SELF",
    effects: [
      { type: "DAMAGE_MULTIPLIER", value: 2, durationTurns: 1 },
      { type: "DAMAGE_REDUCTION", value: 0.5, durationTurns: 1 }
    ]
  },

  silence: {
    id: "silence",
    name: "Silence Strike",
    type: "CONTROL",
    target: "OPPONENT",
    effects: [
      { type: "DAMAGE", value: 20 },
      { type: "SILENCE", durationTurns: 1 }
    ]
  },

  channel: {
    id: "channel",
    name: "Channeling Assault",
    type: "CHANNEL",
    target: "OPPONENT",
    effects: [
      { type: "DAMAGE", value: 10 },
      { type: "DELAYED_DAMAGE", value: 10, repeatTurns: 1 }
    ]
  }
};
