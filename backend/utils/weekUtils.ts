/**
 * 📅 Returns the current "game week" code, aligned to JX3 reset time.
 * Reset = Monday 07:00 China time (UTC+8) = Sunday 23:00 UTC.
 * Output format: "YYYY-W##"
 */
export function getCurrentGameWeek(): string {
  const now = new Date();

  // Convert to UTC+8 (China time)
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const cst = new Date(utc + 8 * 3600 * 1000);

  // Shift back 7 hours to align reset boundary
  const shifted = new Date(cst.getTime() - 7 * 3600 * 1000);

  // ISO week calculation (Monday-based)
  const jan4 = new Date(shifted.getFullYear(), 0, 4);
  const jan4Day = (jan4.getDay() + 6) % 7; // Monday = 0
  const week1 = new Date(jan4);
  week1.setDate(jan4.getDate() - jan4Day);

  const diff = shifted.getTime() - week1.getTime();
  const weekNo = 1 + Math.floor(diff / (7 * 24 * 3600 * 1000));

  return `${shifted.getFullYear()}-W${weekNo}`;
}

/**
 * 🎯 Given any date, compute which game week it belongs to.
 * (Used when filtering schedules by creation date)
 */
export function getGameWeekFromDate(dateString: string): string {
  const date = new Date(dateString);

  // Convert to China time (UTC+8)
  const utc8 = new Date(date.getTime() + 8 * 3600 * 1000);

  // Shift back 7h for reset boundary
  const shifted = new Date(utc8.getTime() - 7 * 3600 * 1000);

  // Calculate ISO week number
  const jan4 = new Date(shifted.getFullYear(), 0, 4);
  const jan4Day = (jan4.getDay() + 6) % 7;
  const week1 = new Date(jan4);
  week1.setDate(jan4.getDate() - jan4Day);

  const diff = shifted.getTime() - week1.getTime();
  const weekNo = 1 + Math.floor(diff / (7 * 24 * 3600 * 1000));

  return `${shifted.getFullYear()}-W${weekNo}`;
}

/**
 * 🕒 Returns start/end UTC dates for a specific game week.
 * Used for backend filtering in controllers.
 */
export function getGameWeekRange(weekCode?: string) {
  const [yearStr, weekStr] = (weekCode || getCurrentGameWeek()).split("-W");
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);

  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = (jan4.getUTCDay() + 6) % 7; // Monday=0
  const weekStart = new Date(jan4);
  weekStart.setUTCDate(jan4.getUTCDate() - jan4Day + (week - 1) * 7);

  // Shift forward 7h to get true reset (Monday 07:00 CN = Sunday 23:00 UTC)
  const start = new Date(weekStart.getTime() + (7 - 8) * 3600 * 1000);
  const end = new Date(start.getTime() + 7 * 24 * 3600 * 1000);

  return { start, end };
}
