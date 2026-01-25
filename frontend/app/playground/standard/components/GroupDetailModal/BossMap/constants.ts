// BossMap/constants.ts
import rawBossData from "@/app/data/boss_drop.json";
import tradableAbilities from "@/app/data/tradable_abilities.json";

export const bossData: Record<string, string[]> = rawBossData as any;

export const tradableSet = new Set(tradableAbilities as string[]);

export const row1 = [81, 82, 83, 84, 85, 86, 87, 88, 89, 90];
export const row2 = [100, 99, 98, 97, 96, 95, 94, 93, 92, 91];

export const highlightAbilities = [
  "蛮熊碎颅击",
  "花钱消灾",
  "斗转金移",
  "特制金创药",
  "万花金创药",
  "一闪天诛",
  "漾剑式",
  "定波式",
  "黑煞落贪狼",
  "毓秀灵药",
  "霞月长针",
  "剑心通明",
  "飞云回转刀",
  "阴阳术退散",
  "兔死狐悲",
  "七荒黑牙",
  "三个铜钱",
  "乾坤一掷",
  "厄毒爆发",
  "坠龙惊鸿",
  "引燃",
  "火焰之种",
  "阴雷之种",
  "短歌万劫",
  "泉映幻歌",
  "流霞点绛",
  "云海听弦",
  "无我无剑式",
  "退山凝",
  "电挈昆吾",
  "特制止血钳",
  "血狱隐杀"

];
