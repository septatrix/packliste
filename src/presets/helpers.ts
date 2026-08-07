import type { ParamGender } from '../lib/schema';

/**
 * Whether a gender-specific item should be included. Leaving gender unset
 * ("keine Angabe", an absent or empty `vars.gender`) is treated as "include
 * every gender-specific variant" — the opposite default of climate/travel/
 * destination, whose "unset" means "include none of the conditional items"
 * via plain `.includes('value')` checks.
 */
export function matchesGender(gender: string[] | undefined, target: ParamGender): boolean {
  return gender === undefined || gender.length === 0 || gender.includes(target);
}

/** Scale a per-day count over the trip length, optionally capped. */
export function perDay(count: number, days: number, cap?: number): number {
  const value = count * days;
  return cap !== undefined ? Math.min(value, cap) : value;
}

/** Scale a {min, max} per-day range over the trip length, optionally capped. */
export function perDayRange(
  min: number,
  max: number,
  days: number,
  cap?: number,
): { min: number; max: number } {
  return { min: perDay(min, days, cap), max: perDay(max, days, cap) };
}

/**
 * Human-readable explanation of a `perDay`/`perDayRange` computation, for
 * an item's `note` field (shown in the info-icon tooltip alongside its
 * source preset). Call with the same arguments as the matching `perDay`
 * call so the note always matches what was actually computed.
 */
export function perDayNote(count: number, days: number, cap?: number): string {
  const raw = count * days;
  return cap !== undefined && raw > cap
    ? `${count} pro Tag × ${days} Tage, gedeckelt bei ${cap}`
    : `${count} pro Tag × ${days} Tage`;
}

/** Explanation for an author-chosen (not day-scaled) {min, max} range. */
export function rangeNote(min: number, max: number): string {
  return `Frei wählbar zwischen ${min} und ${max}`;
}
