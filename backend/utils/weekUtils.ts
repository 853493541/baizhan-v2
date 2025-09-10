export function getCurrentWeek(): string {
  const now = new Date();
  const onejan = new Date(now.getFullYear(), 0, 1);
  const millisecsInDay = 86400000;
  const days = Math.floor((now.getTime() - onejan.getTime()) / millisecsInDay);
  const week = Math.ceil((days + onejan.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${week}`;
}
