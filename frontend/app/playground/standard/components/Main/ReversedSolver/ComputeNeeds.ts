/**
 * ComputeNeeds
 * -----------------------------
 * Given full characters and checkedAbilities,
 * returns a new array where each character has a "needs" array
 * listing every missing (ability, level) pair separately.
 */
export function ComputeNeeds(
  characters: any[],
  checkedAbilities: { name: string; level: number; available: boolean }[]
) {
  const requiredByName: Record<string, number[]> = {};

  // Collect required levels by ability name
  for (const a of checkedAbilities) {
    if (!a.available) continue;
    if (!requiredByName[a.name]) requiredByName[a.name] = [];
    requiredByName[a.name].push(a.level);
  }

  // Deduplicate and sort levels
  for (const key of Object.keys(requiredByName)) {
    requiredByName[key] = Array.from(new Set(requiredByName[key])).sort((a, b) => a - b);
  }

  // Compute missing abilities for each character
  return characters.map((char) => {
    const needs: { name: string; level: number }[] = [];

    for (const [name, reqLevels] of Object.entries(requiredByName)) {
      const current = char?.abilities?.[name] ?? 0;
      for (const lvl of reqLevels) {
        if (current < lvl) {
          needs.push({ name, level: lvl });
        }
      }
    }

    return { ...char, needs };
  });
}
