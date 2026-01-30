// in-game/statusBar/resolveBuff.ts

import { BUFF_REGISTRY } from "./buffRegistry";

export function resolveBuff(params: {
  sourceCardId?: string;
  type: string;
  value?: number;
  chance?: number;
  repeatTurns?: number;
  remainingTurns: number;
}) {
  const key =
    params.sourceCardId &&
    `${params.sourceCardId}:${params.type}`;

  const def = key ? BUFF_REGISTRY[key] : undefined;

  if (!def) {
    return {
      name: params.type,
      category: "DEBUFF" as const,
      description: `${params.type}`,
    };
  }

  return {
    name: def.name,
    category: def.category,
    description: def.description(params),
  };
}
