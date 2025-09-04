export function parseOCRLines(lines: string[]): Record<string, number> {
  const chineseLevelMap: Record<string, number> = {
    十重: 10,
    九重: 9,
    八重: 8,
    七重: 7,
    六重: 6,
    五重: 5,
    四重: 4,
    三重: 3,
    二重: 2,
    一重: 1,
  };

  let currentLevel: number | null = null;
  const parsed: Record<string, number> = {};

  for (const line of lines) {
    const text = line.trim();
    if (!text) continue;
    if (chineseLevelMap[text] !== undefined) {
      currentLevel = chineseLevelMap[text];
      continue;
    }
    if (currentLevel) parsed[text] = currentLevel;
  }

  return parsed;
}
