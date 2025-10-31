/**
 * 📅 Returns the current "game week" code aligned to JX3 reset time.
 * Reset = Monday 07:00 China time (UTC+8) = Sunday 23:00 UTC.
 * Example output: "2025-W44"
 */
export function getCurrentGameWeek(): string {
  const now = new Date();

  // Convert to UTC+8 (China Standard Time)
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const cst = new Date(utc + 8 * 3600 * 1000);

  // ✅ Shift forward 1 hour to align global boundaries (CN & California)
  const shifted = new Date(cst.getTime() + 1 * 3600 * 1000);

  // --- ISO week calculation (Monday-based, UTC-safe) ---
  const year = shifted.getUTCFullYear();
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = (jan4.getUTCDay() + 6) % 7; // Monday = 0
  const week1 = new Date(jan4);
  week1.setUTCDate(jan4.getUTCDate() - jan4Day);

  const diff = shifted.getTime() - week1.getTime();
  const weekNo = 1 + Math.floor(diff / (7 * 24 * 3600 * 1000));

  return `${year}-W${weekNo}`;
}

/**
 * 🎯 Given a date (ISO string), return its game-week code.
 * Used to classify schedules by creation time.
 */
export function getGameWeekFromDate(dateString: string): string {
  const date = new Date(dateString);

  // Convert to UTC+8 (China Standard Time)
  const utc8 = new Date(date.getTime() + 8 * 3600 * 1000);

  // ✅ Shift forward 1 hour for same alignment as getCurrentGameWeek
  const shifted = new Date(utc8.getTime() + 1 * 3600 * 1000);

  // --- ISO week logic (UTC-safe) ---
  const year = shifted.getUTCFullYear();
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = (jan4.getUTCDay() + 6) % 7;
  const week1 = new Date(jan4);
  week1.setUTCDate(jan4.getUTCDate() - jan4Day);

  const diff = shifted.getTime() - week1.getTime();
  const weekNo = 1 + Math.floor(diff / (7 * 24 * 3600 * 1000));

  return `${year}-W${weekNo}`;
}

/**
 * 🕒 Returns UTC start/end boundaries for a specific game week.
 * Start = Sunday 23:00 UTC (Monday 07:00 CN)
 * End   = +7 days later (Sunday 23:00 UTC next week)
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
