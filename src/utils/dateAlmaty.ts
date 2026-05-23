/** Календарь и час в логике «Алматы» (UTC+5), как на сервере в crm/utils/dateUtils.js */

export function getDateYmdAlmaty(date: Date = new Date()): string {
  const almatyTime = new Date(date.getTime() + 5 * 60 * 60 * 1000);
  return almatyTime.toISOString().split('T')[0];
}

export function getHourAlmaty(date: Date = new Date()): number {
  const almatyTime = new Date(date.getTime() + 5 * 60 * 60 * 1000);
  return almatyTime.getUTCHours();
}

function parseYmdUtcNoon(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

/** 0 = воскресенье … 6 = суббота для календарной даты YYYY-MM-DD */
export function weekdayFromYmd(ymd: string): number {
  return parseYmdUtcNoon(ymd).getUTCDay();
}

export function nextYmd(ymd: string): string {
  const t = parseYmdUtcNoon(ymd);
  t.setUTCDate(t.getUTCDate() + 1);
  return t.toISOString().split('T')[0];
}

export function addDaysYmd(ymd: string, days: number): string {
  const t = parseYmdUtcNoon(ymd);
  t.setUTCDate(t.getUTCDate() + days);
  return t.toISOString().split('T')[0];
}
