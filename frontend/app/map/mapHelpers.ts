// mapHelpers.ts

/* ============================================================
   CONSTANTS
============================================================ */
export const specialBosses = [
  "武雪散",
  "萧武宗",
  "悉达罗摩",
  "阿基修斯",
  "提多罗吒",
  "萧沙",
  "谢云流",
  "卫栖梧",
  "牡丹",
  "迟驻",
  "拓跋思南",
  "公孙二娘",
  "青年谢云流",

];

export const row1 = [81, 82, 83, 84, 85, 86, 87, 88, 89, 90];
export const row2 = [100, 99, 98, 97, 96, 95, 94, 93, 92, 91];

/* ============================================================
   SAME RANGE CHECK
============================================================ */
export const isSameRange = (a: number, b: number): boolean => {
  if (a >= 81 && a <= 89 && b >= 81 && b <= 89) return true;
  if (a >= 91 && a <= 99 && b >= 91 && b <= 99) return true;
  if (a === 90 && b === 90) return true;
  if (a === 100 && b === 100) return true;
  return false;
};

/* ============================================================
   PARSE API FLOORS
============================================================ */
export const parseFloorsFromAPI = (raw: any): Record<number, string> => {
  const out: Record<number, string> = {};
  if (!raw) return out;

  for (const [floor, obj] of Object.entries(raw)) {
    out[Number(floor)] = (obj as any).boss;
  }

  return out;
};

/* ============================================================
   APPLY BOSS SELECTION TO FLOOR ASSIGNMENTS
============================================================ */
export const applySelectionToFloors = (
  floor: number,
  boss: string,
  current: Record<number, string>
): Record<number, string> => {
  const updated = { ...current };

  for (const [f, b] of Object.entries(current)) {
    const ff = Number(f);
    if (b === boss && isSameRange(ff, floor) && ff !== floor) {
      updated[ff] = "";
    }
  }

  updated[floor] = boss;
  return updated;
};

/* ============================================================
   GET FULL BOSS POOL
============================================================ */
export const getFullPool = (
  floor: number,
  specialBosses: string[],
  normalBosses: string[]
): string[] => {
  if (floor === 90 || floor === 100) return specialBosses;
  if (floor >= 81 && floor <= 89) return normalBosses;
  if (floor >= 91 && floor <= 99) return normalBosses;
  return [];
};
