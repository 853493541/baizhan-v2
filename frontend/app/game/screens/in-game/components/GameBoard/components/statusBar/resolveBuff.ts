// in-game/statusBar/resolveBuff.ts

import { BUFF_REGISTRY } from "./buffRegistry";
import { CARD_NAME_MAP } from "../../../card/cardNameMap";

/**
 * Resolve a status/buff for display.
 *
 * FINAL RULE (ENFORCED):
 * - sourceCardId IS the identity source
 * - Display name is resolved via CARD_NAME_MAP
 * - Any duration-based status MUST display its source card name
 * - BUFF_REGISTRY can override name/description when explicitly defined
 */

export function resolveBuff(params: {
  sourceCardId?: string;
  type: string;
  value?: number;
  chance?: number;
  repeatTurns?: number;
  remainingTurns: number;
}) {
  // registry key: cardId + effectType
  const key =
    params.sourceCardId &&
    `${params.sourceCardId}:${params.type}`;

  const def = key ? BUFF_REGISTRY[key] : undefined;

  // 1️⃣ Explicit registry override (highest priority)
  if (def) {
    return {
      name: def.name,
      category: def.category,
      description: def.description(params),
    };
  }

  // 2️⃣ HARD RULE: duration-based effect → use source card display name
  if (params.sourceCardId) {
    const displayName =
      CARD_NAME_MAP[params.sourceCardId] ?? params.sourceCardId;

    return {
      name: displayName,
      category: "DEBUFF" as const,
      description: `${displayName}（${params.remainingTurns} 回合）`,
    };
  }

  // 3️⃣ Absolute fallback (should not happen)
  return {
    name: params.type,
    category: "DEBUFF" as const,
    description: `${params.type}`,
  };
}
