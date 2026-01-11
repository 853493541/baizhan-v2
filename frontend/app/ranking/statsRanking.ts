export interface RankingCharacter {
  characterId: string;
  name: string;
  server: "梦江南" | "乾坤一掷" | "唯我独尊";
  role: "DPS" | "Tank" | "Healer";
  active: boolean;
  energy: number;
  durability: number;
  owner: string;
  class: string;
}

interface RankFilters {
  owner: string;
  server: string;
  role: string;
  onlyEnabled: boolean;
}

export function rankCharacters(
  characters: RankingCharacter[],
  filters: RankFilters
): RankingCharacter[] {
  const { owner, server, role, onlyEnabled } = filters;

  return [...characters]
    .filter((c) => {
      if (onlyEnabled && !c.active) return false;
      if (owner && c.owner !== owner) return false;
      if (server && c.server !== server) return false;
      if (role && c.role !== role) return false;
      return true;
    })
    .sort((a, b) => {
      const totalA = a.energy + a.durability;
      const totalB = b.energy + b.durability;
      return totalB - totalA;
    });
}
