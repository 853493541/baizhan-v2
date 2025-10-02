import rawBossData from "@/app/data/boss_skills_collection_reward.json";
import tradableAbilities from "@/app/data/tradable_abilities.json";

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

// 🔹 Default conflict-check abilities (Tier 2 highlight set)
export const CORE_ABILITIES = [
  "水遁水流闪","蛮熊碎颅击","花钱消灾","斗转金移","特制金创药","万花金创药",
  "一闪天诛","初景白雨","漾剑式","定波式","黑煞落贪狼","毓秀灵药","霞月长针",
  "剑心通明","飞云回转刀","阴阳术退散","尸鬼封烬","兔死狐悲","血龙甩尾","七荒黑牙",
  "三个铜钱","乾坤一掷","厄毒爆发","坠龙惊鸿","引燃","火焰之种","阴雷之种",
  "短歌万劫","泉映幻歌",
];

/**
 * Fetch weekly map from backend
 */
export async function getCurrentMap(): Promise<{ name: string; level: number }[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weekly-map`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch weekly map");
    const data: WeeklyMapResponse = await res.json();

    console.log("[playgroundHelpers] Raw weekly map response:", data);

    const bosses: { name: string; level: number }[] = [];
    for (const [floor, obj] of Object.entries(data.floors)) {
      const floorNum = Number(floor);
      let level = 10;

      if (floorNum >= 81 && floorNum <= 90) level = 9;   // ✅ floor 90 now treated as 9
      if (floorNum >= 91 && floorNum <= 99) level = 10;
      if (floorNum === 100) level = 10;

      bosses.push({ name: obj.boss, level });
    }

    console.log("[playgroundHelpers] Parsed bosses with levels:", bosses);
    return bosses;
  } catch (err) {
    console.error("[playgroundHelpers] Error fetching weekly map:", err);
    return [];
  }
}

/**
 * Expand boss → abilities
 */
function getBossAbilities(boss: string, level: number): Ability[] {
  if (level === 90) {
    console.warn(`⚠️ [playgroundHelpers] Level 90 detected for boss "${boss}", forcing to 9`);
    level = 9;
  }

  const abilities: string[] = bossData[boss] || [];
  console.log(`[playgroundHelpers] Expanding boss "${boss}" (level ${level}) →`, abilities);

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

  // 🔹 Remove tradables here
  const nonTradables = deduped.filter((a) => !tradableAbilities.includes(a.name));

  console.log("[playgroundHelpers] Final deduped ability pool (no tradables):", nonTradables);
  return nonTradables;
}

/**
 * Build the *default mode* conflict-check list for this week (highlight abilities only)
 */
export async function getDefaultModeChecklist(): Promise<Ability[]> {
  const pool = await getDefaultAbilityPool();

  // CORE_ABILITIES are guaranteed non-tradable set
  const filtered = pool.filter((a) => CORE_ABILITIES.includes(a.name));
  console.log("✅ [playgroundHelpers] Default mode checklist (highlight set):", filtered);

  return filtered;
}
