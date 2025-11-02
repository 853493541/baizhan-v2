/**
 * 📅 Returns the current "game week" code aligned to JX3 reset time.
 * Reset = Monday 07:00 China time (UTC+8) = Sunday 23:00 UTC.
 * Example output: "2025-W44"
 *
 * Logic uses pure UTC math so results are identical in all locales.
 */

export function getCurrentGameWeek(): string {
  const now = new Date();
  const utcMillis = now.getTime();

  // Convert to China time (UTC +8 hours)
  const shiftedMillis = utcMillis + 8 * 3600 * 1000;
  const shiftedUTC = new Date(shiftedMillis);

  // --- ISO week calculation (UTC-safe) ---
  const year = shiftedUTC.getUTCFullYear();
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = (jan4.getUTCDay() + 6) % 7; // Monday = 0
  const week1 = new Date(jan4);
  week1.setUTCDate(jan4.getUTCDate() - jan4Day);

  const diff = shiftedUTC.getTime() - week1.getTime();
  const weekNo = 1 + Math.floor(diff / (7 * 24 * 3600 * 1000));
  return `${year}-W${weekNo}`;
}

/**
 * 🎯 Given a date (ISO string with timezone), return its game-week code.
 * Used to classify schedules by creation time.
 */
export function getGameWeekFromDate(dateString: string): string {
  const date = new Date(dateString);
  const utcMillis = date.getTime();

  // Convert to China time (UTC +8 hours)
  const shiftedMillis = utcMillis + 8 * 3600 * 1000;
  const shiftedUTC = new Date(shiftedMillis);

  const year = shiftedUTC.getUTCFullYear();
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = (jan4.getUTCDay() + 6) % 7;
  const week1 = new Date(jan4);
  week1.setUTCDate(jan4.getUTCDate() - jan4Day);

  const diff = shiftedUTC.getTime() - week1.getTime();
  const weekNo = 1 + Math.floor(diff / (7 * 24 * 3600 * 1000));
  return `${year}-W${weekNo}`;
}

/**
 * 🕒 Returns UTC start/end boundaries for a specific game week.
 * Start = Sunday 23:00 UTC (Monday 07:00 CN)
 * End    = +7 days later (Sunday 23:00 UTC next week)
 */
export function getGameWeekRange(weekCode?: string) {
  const [yearStr, weekStr] = (weekCode || getCurrentGameWeek()).split("-W");
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);

  // ISO Monday start in UTC
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = (jan4.getUTCDay() + 6) % 7;
  const weekStart = new Date(jan4);
  weekStart.setUTCDate(jan4.getUTCDate() - jan4Day + (week - 1) * 7);

  // Sunday 23:00 UTC = Monday 07:00 CN
  const start = new Date(weekStart.getTime() - 1 * 3600 * 1000);
  const end = new Date(start.getTime() + 7 * 24 * 3600 * 1000);

  return { start, end };
}
