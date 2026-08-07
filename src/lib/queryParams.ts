import { activityPresets } from '../presets';
import { ClimateSchema, DestinationSchema, IsoDateSchema, ParamGenderSchema, TravelSchema, TripSelectionSchema, type TripSelection } from './schema';

/**
 * Reads trip-selection overrides from URL query params, so a link like
 * `?activities=skifahren,wandern&climate=kalt,frostig&start=2026-12-20&end=2026-12-27`
 * can prefill the form — e.g. for sharing a trip or linking in from another
 * page. Only fields actually present in the query string are touched; a
 * missing param leaves that field to localStorage/the default untouched.
 *
 * `climate`/`travel`/`destination`/`gender` all end up in `overrides.vars`
 * now (see `PresetVariable`/`TripSelection.vars` in `lib/schema.ts`) — they
 * used to be bespoke top-level fields, but the query-param names/formats
 * below are unchanged, only where the parsed value is stored.
 *
 * `presetIds`/`vars.climate` are arrays, so an explicit-but-empty value
 * (`?activities=`) is a valid override on its own — it means "none
 * selected", the same "keine Angabe" the rest of the app already uses for
 * an empty array, not "ignore this param". Unknown/malformed entries in a
 * comma list are dropped individually rather than invalidating the whole
 * list, so one typo doesn't wipe out the other valid values.
 *
 * `vars.travel`/`vars.destination`/`vars.gender` are single-select (a
 * zero-or-one-element array), so there's no plain-empty-array-vs-absent
 * distinction to make: a present-but-unrecognized value (including an empty
 * string) is treated the same as an explicit "keine Angabe" (`[]`) rather
 * than being silently ignored, since a typo degrading to "no selection" is
 * the same benign fallback the rest of the schema already relies on for
 * these fields.
 */
export function tripSelectionFromQuery(search: string): Partial<TripSelection> {
  const query = new URLSearchParams(search);
  const overrides: Partial<TripSelection> = {};
  const vars: Record<string, string[]> = {};

  const knownActivityIds = new Set(activityPresets.map((preset) => preset.id));

  const activities = query.get('activities');
  if (activities !== null) {
    overrides.presetIds = activities
      .split(',')
      .map((id) => id.trim())
      .filter((id) => knownActivityIds.has(id));
  }

  const climate = query.get('climate');
  if (climate !== null) {
    vars.climate = climate
      .split(',')
      .map((value) => value.trim())
      .filter((value) => ClimateSchema.safeParse(value).success);
  }

  const start = query.get('start');
  if (start !== null && IsoDateSchema.safeParse(start).success) overrides.startDate = start;

  const end = query.get('end');
  if (end !== null && IsoDateSchema.safeParse(end).success) overrides.endDate = end;

  const travel = query.get('travel');
  if (travel !== null) {
    const parsed = TravelSchema.safeParse(travel);
    vars.travel = parsed.success ? [parsed.data] : [];
  }

  const destination = query.get('destination');
  if (destination !== null) {
    const parsed = DestinationSchema.safeParse(destination);
    vars.destination = parsed.success ? [parsed.data] : [];
  }

  const gender = query.get('gender');
  if (gender !== null) {
    const parsed = ParamGenderSchema.safeParse(gender);
    vars.gender = parsed.success ? [parsed.data] : [];
  }

  if (Object.keys(vars).length > 0) overrides.vars = vars;

  return overrides;
}

/**
 * Applies query-param overrides on top of an already-resolved trip selection
 * (from localStorage or the built-in default). `vars` is merged one level
 * deep rather than replaced outright, so a link overriding just `climate`
 * doesn't wipe out an unrelated stored variable value (e.g. Sommerlager's
 * "Rolle") that the query string never mentioned.
 *
 * The only way the merge can violate `TripSelectionSchema` is a `start`/`end`
 * pair where the end lands before the start (every other field was already
 * validated one-by-one in `tripSelectionFromQuery`) — in that case the date
 * overrides are dropped and the rest still applies, rather than discarding
 * the whole link.
 */
export function applyQueryOverrides(base: TripSelection, search: string): TripSelection {
  const overrides = tripSelectionFromQuery(search);
  const merged = { ...base, ...overrides, vars: { ...base.vars, ...overrides.vars } };
  const parsed = TripSelectionSchema.safeParse(merged);
  if (parsed.success) return parsed.data;

  const { startDate: _startDate, endDate: _endDate, ...restOverrides } = overrides;
  console.warn('Ungültige start/end-Angaben in der URL werden ignoriert:', parsed.error.message);
  return { ...base, ...restOverrides, vars: { ...base.vars, ...restOverrides.vars } };
}
