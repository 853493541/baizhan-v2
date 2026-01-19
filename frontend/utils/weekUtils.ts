/**
 * 📅 Game week utilities aligned to JX3 reset time
 *
 * Reset rule:
 * - Weekly reset happens at **Monday 07:00 China time (UTC+8)**
 * - This equals **Sunday 23:00 UTC**
 *
 * Strategy:
 * - Shift UTC time by **+1 hour**
 *   (+8h China time − 7h reset offset)
 * - Then apply standard ISO week calculation in UTC
 *
 * This ensures:
 * - Week flips exactly at Monday 07:00 CN
 * - Pure UTC math (locale-independent)
 * - Frontend & backend stay consistent
 */

/* =========================================================
   Current game week
========================================================= */
export function getCurrentGameWeek(): string {
  const now = new Date();
  const utcMillis = now.getTime();

  // 🔧 Net shift: +1 hour
  const shiftedMillis = utcMillis + 1 * 3600 * 1000;
  const shiftedUTC = new Date(shiftedMillis);

  return calcISOWeek(shiftedUTC);
}

/* =========================================================
   Game week from specific date (ISO string)
========================================================= */
export function getGameWeekFromDate(dateString: string): string {
  const date = new Date(dateString);
  const utcMillis = date.getTime();

  // 🔧 Same +1 hour shift (must match getCurrentGameWeek)
  const shiftedMillis = utcMillis + 1 * 3600 * 1000;
  const shiftedUTC = new Date(shiftedMillis);

  return calcISOWeek(shiftedUTC);
}

/* =========================================================
   Game week UTC range
   Start = Sunday 23:00 UTC (Monday 07:00 CN)
   End   = +7 days
========================================================= */
export function getGameWeekRange(weekCode?: string) {
  const [yearStr, weekStr] = (weekCode || getCurrentGameWeek()).split("-W");
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);

  // ISO Monday start (UTC)
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = (jan4.getUTCDay() + 6) % 7; // Monday = 0
  const week1 = new Date(jan4);
  week1.setUTCDate(jan4.getUTCDate() - jan4Day);

  const isoWeekStart = new Date(
    week1.getTime() + (week - 1) * 7 * 24 * 3600 * 1000
  );

  // 🔧 Shift back to Sunday 23:00 UTC
  const start = new Date(isoWeekStart.getTime() - 1 * 3600 * 1000);
  const end = new Date(start.getTime() + 7 * 24 * 3600 * 1000);

  return { start, end };
}

/* =========================================================
   Internal ISO week calculator (UTC-safe)
========================================================= */
function calcISOWeek(dateUTC: Date): string {
  const year = dateUTC.getUTCFullYear();

  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = (jan4.getUTCDay() + 6) % 7; // Monday = 0

  const week1 = new Date(jan4);
  week1.setUTCDate(jan4.getUTCDate() - jan4Day);

  const diff = dateUTC.getTime() - week1.getTime();
  const weekNo = 1 + Math.floor(diff / (7 * 24 * 3600 * 1000));

  return `${year}-W${weekNo}`;
}
export function debugGameWeek(input: string) {
  const date = new Date(input);

  const utc = date.toUTCString();
  const chinaTime = new Date(date.getTime() + 8 * 3600 * 1000).toUTCString();
  const gameWeek = getGameWeekFromDate(input);

  return {
    input,
    parsedLocal: date.toString(),
    utc,
    chinaTime: `${chinaTime} (UTC+8)`,
    gameWeek,
  };
}