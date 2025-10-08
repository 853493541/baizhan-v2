/**
 * 📅 Returns the current "game week" code aligned to game reset time.
 * Reset = Monday 07:00 China time (UTC+8) = Sunday 23:00 UTC.
 * Example output: "2025-W41"
 */
export function getCurrentGameWeek(): string {
  const now = new Date();

  // Convert to China time (UTC+8)
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const cst = new Date(utc + 8 * 3600 * 1000);

  // Shift back 7 hours to match game reset (Monday 07:00 CST)
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
 * 🎯 Given a date (ISO string), return its game week code.
 * Used to classify schedules by creation time.
 */
export function getGameWeekFromDate(dateString: string): string {
  const date = new Date(dateString);

  // Convert to UTC+8 (China time)
  const utc8 = new Date(date.getTime() + 8 * 3600 * 1000);

  // Shift back 7h for game reset
  const shifted = new Date(utc8.getTime() - 7 * 3600 * 1000);

  // ISO week logic
  const jan4 = new Date(shifted.getFullYear(), 0, 4);
  const jan4Day = (jan4.getDay() + 6) % 7;
  const week1 = new Date(jan4);
  week1.setDate(jan4.getDate() - jan4Day);

  const diff = shifted.getTime() - week1.getTime();
  const weekNo = 1 + Math.floor(diff / (7 * 24 * 3600 * 1000));

  return `${shifted.getFullYear()}-W${weekNo}`;
}
