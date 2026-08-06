import type { ParamGender } from '../lib/schema';

/**
 * Whether a gender-specific item should be included. Leaving gender unset
 * ("keine Angabe") is treated as "include every gender-specific variant" —
 * the opposite default of climate/travel/destination, whose "unset" means
 * "include none of the conditional items" via plain `=== 'value'` checks.
 */
export function matchesGender(gender: ParamGender | undefined, target: ParamGender): boolean {
  return gender === undefined || gender === target;
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
