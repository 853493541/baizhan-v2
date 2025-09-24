// frontend/utils/playgroundHelpers.ts

import rawBossData from "@/app/data/boss_skills_collection_reward.json";

interface BossData {
  [bossName: string]: string[];
}
const bossData: BossData = rawBossData as BossData;

interface WeeklyMapResponse {
  floors: {
    [floor: string]: {
      boss: string;
    };
  };
}

interface Ability {
  name: string;
  level: number;
}

// 🔹 Default conflict-check abilities (hardcode)
const DEFAULT_ABILITIES = [
  "斗转金移",
  "花钱消灾",
  "黑煞落贪狼",
  "一闪天诛",
  "引燃",
  "漾剑式",
  "阴阳术退散",
  "兔死狐悲",
];

/**
 * Fetch weekly map from backend
 */
export async function getCurrentMap(): Promise<{ name: string; level: number }[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map`, {
      cache: "no-store", // ✅ force fresh fetch
    });
    if (!res.ok) throw new Error("Failed to fetch weekly map");
    const data: WeeklyMapResponse = await res.json();

    console.log("🌍 [playgroundHelpers] Raw weekly map response:", data);

    const bosses: { name: string; level: number }[] = [];
    for (const [floor, obj] of Object.entries(data.floors)) {
      const floorNum = Number(floor);
      let level = 10;
      if (floorNum >= 81 && floorNum <= 89) level = 9;
      if (floorNum === 90 || floorNum === 100) level = 10;
      if (floorNum >= 91 && floorNum <= 99) level = 10;

      bosses.push({ name: obj.boss, level });
    }

    console.log("📅 [playgroundHelpers] Parsed bosses with levels:", bosses);
    return bosses;
  } catch (err) {
    console.error("❌ [playgroundHelpers] Error fetching weekly map:", err);
    return [];
  }
}

/**
 * Expand boss → abilities
 */
function getBossAbilities(boss: string, level: number): Ability[] {
  const abilities: string[] = bossData[boss] || [];
  console.log(`🎯 [playgroundHelpers] Expanding boss "${boss}" (level ${level}) →`, abilities);

  if (level === 9) {
    return abilities.map((a) => ({ name: a, level: 9 }));
  }
  if (level === 10) {
    return abilities.flatMap((a) => [
      { name: a, level: 9 },
      { name: a, level: 10 },
    ]);
  }
  return [];
}

/**
 * Build the full pool for this week
 */
export async function getDefaultAbilityPool(): Promise<Ability[]> {
  const bosses = await getCurrentMap();
  const pool: Ability[] = [];

  for (const boss of bosses) {
    pool.push(...getBossAbilities(boss.name, boss.level));
  }

  // Deduplicate
  const seen = new Set<string>();
  const deduped = pool.filter((a) => {
    const key = `${a.name}-${a.level}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log("📦 [playgroundHelpers] Final deduped ability pool:", deduped);
  return deduped;
}

/**
 * Build the *default mode* conflict-check list for this week
 */
export async function getDefaultModeChecklist(): Promise<Ability[]> {
  const pool = await getDefaultAbilityPool();

  const filtered = pool.filter((a) => DEFAULT_ABILITIES.includes(a.name));
  console.log("✅ [playgroundHelpers] Default mode checklist (filtered):", filtered);

  return filtered;
}
