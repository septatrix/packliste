/**
 * Small ISO-date (yyyy-mm-dd) helpers for the trip start/end date pickers.
 * Dates are parsed at UTC midnight so calendar-day arithmetic is not
 * affected by the browser's local timezone or DST transitions.
 */

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
}

/** Number of calendar days spanned by [startIso, endIso], inclusive of both ends. */
export function daysBetweenInclusive(startIso: string, endIso: string): number {
  const start = new Date(`${startIso}T00:00:00Z`);
  const end = new Date(`${endIso}T00:00:00Z`);
  const diffDays = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return Math.max(1, diffDays + 1);
}
