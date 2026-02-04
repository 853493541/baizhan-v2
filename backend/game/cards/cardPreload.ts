// backend/game/cards/cardPreload.ts
import { CARDS } from "./cards";

/**
 * Frontend-facing preload payload.
 * - Display only
 * - No engine logic
 * - O(1) lookup friendly
 */
export function buildCardPreload() {
  const cards: any[] = [];
  const buffs: any[] = [];

  for (const card of Object.values(CARDS)) {
    const cardPayload = {
      id: card.id,
      name: card.name,
      description: card.description,
      type: card.type,
      target: card.target,
      effects: card.effects ?? [],
    };

    cards.push(cardPayload);

    if (Array.isArray(card.buffs)) {
      for (const buff of card.buffs) {
        buffs.push({
          buffId: buff.buffId,
          name: buff.name,
          category: buff.category,
          durationTurns: buff.durationTurns,
          breakOnPlay: buff.breakOnPlay ?? false,
          effects: buff.effects ?? [],

          // 🔑 UI display helpers
          sourceCardId: card.id,
          sourceCardName: card.name,
        });
      }
    }
  }

  const cardMap = Object.fromEntries(
    cards.map((c) => [c.id, c])
  );

  const buffMap = Object.fromEntries(
    buffs.map((b) => [b.buffId, b])
  );

  return {
    cards,
    cardMap,
    buffs,
    buffMap,
  };
}
