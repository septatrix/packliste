import { allPresets } from '../presets';
import { IsoDateSchema, TripSelectionSchema, type PresetVariable, type TripSelection } from './schema';

const knownPresetIds = new Set(allPresets.map((preset) => preset.id));

/**
 * Every variable any registered preset claims (see `PresetDefinition.variables`),
 * deduped by id — climate/travel/destination/gender plus anything
 * preset-specific like Sommerlager's "Rolle". Used to parse/serialize `vars`
 * query params generically, keyed by variable id, instead of hardcoding a
 * fixed set of fields: a variable's query param name is just its id (true
 * today for climate/travel/destination/gender by construction — see
 * `presets/sharedVariables.ts` — and for any future claimed variable too).
 */
function allClaimedVariables(): PresetVariable[] {
  const byId = new Map<string, PresetVariable>();
  for (const preset of allPresets) {
    for (const variable of preset.variables ?? []) {
      if (!byId.has(variable.id)) byId.set(variable.id, variable);
    }
  }
  return [...byId.values()];
}

/**
 * Reads trip-selection overrides from URL query params, so a link like
 * `?activities=base,skifahren,wandern&climate=kalt,frostig&start=2026-12-20&end=2026-12-27`
 * can prefill the form — e.g. for sharing a trip or linking in from another
 * page. Only fields actually present in the query string are touched; a
 * missing param leaves that field to localStorage/the default untouched.
 * The current selection is also kept in sync back to the URL as the user
 * edits it (`tripSelectionToQueryString`, `PackingApp.vue`), so the address
 * bar is always a permalink for the trip currently shown.
 *
 * `activities` includes `base`'s id like any other preset now that it's an
 * ordinary, uncheckable entry in `presetIds` rather than always-on.
 *
 * `presetIds` is an array, so an explicit-but-empty value (`?activities=`)
 * is a valid override on its own — it means "none selected", the same
 * "keine Angabe" the rest of the app already uses for an empty array, not
 * "ignore this param". Unknown/malformed entries in a comma list are
 * dropped individually rather than invalidating the whole list, so one
 * typo doesn't wipe out the other valid values.
 *
 * Every claimed variable's query param (`climate`, `travel`, …) behaves the
 * same way for a `multi` variable. For a single-select variable, a
 * present-but-unrecognized value (including an empty string) is treated as
 * an explicit "keine Angabe" (`[]`) if the variable allows that
 * (`allowUnset`) — otherwise (a variable that must always have a concrete
 * value, like Sommerlager's "Rolle") an invalid value is simply ignored,
 * since there's no "unset" state to fall back to; the stored/default value
 * applies instead.
 */
export function tripSelectionFromQuery(search: string): Partial<TripSelection> {
  const query = new URLSearchParams(search);
  const overrides: Partial<TripSelection> = {};

  const activities = query.get('activities');
  if (activities !== null) {
    overrides.presetIds = activities
      .split(',')
      .map((id) => id.trim())
      .filter((id) => knownPresetIds.has(id));
  }

  const start = query.get('start');
  if (start !== null && IsoDateSchema.safeParse(start).success) overrides.startDate = start;

  const end = query.get('end');
  if (end !== null && IsoDateSchema.safeParse(end).success) overrides.endDate = end;

  const vars: Record<string, string[]> = {};
  for (const variable of allClaimedVariables()) {
    const raw = query.get(variable.id);
    if (raw === null) continue;

    const validValues = new Set(variable.options.map((option) => option.value));
    const values = raw
      .split(',')
      .map((value) => value.trim())
      .filter((value) => validValues.has(value));

    if (variable.multi) {
      vars[variable.id] = values;
    } else if (values.length > 0) {
      vars[variable.id] = [values[0]];
    } else if (variable.allowUnset) {
      vars[variable.id] = [];
    }
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
export function applyQueryOverrides(currentSelection: TripSelection, search: string): TripSelection {
  const overrides = tripSelectionFromQuery(search);
  const merged = { ...currentSelection, ...overrides, vars: { ...currentSelection.vars, ...overrides.vars } };
  const parsed = TripSelectionSchema.safeParse(merged);
  if (parsed.success) return parsed.data;

  const { startDate: _startDate, endDate: _endDate, ...restOverrides } = overrides;
  console.warn('Ungültige start/end-Angaben in der URL werden ignoriert:', parsed.error.message);
  return { ...currentSelection, ...restOverrides, vars: { ...currentSelection.vars, ...restOverrides.vars } };
}

/**
 * The inverse of `tripSelectionFromQuery`: serializes a trip selection into
 * the same query-string format it reads, so the current selection can be
 * kept live in the address bar (`PackingApp.vue` calls this on every change
 * via `history.replaceState`, see [Prefilling via URL query
 * params](../README.md#prefilling-via-url-query-params)) — copying the URL
 * at any point shares exactly the trip currently shown, not just whatever
 * was there on page load.
 *
 * Built as a plain string (not `URLSearchParams.toString()`) so the
 * comma-separated lists stay human-readable (`climate=kalt,frostig` rather
 * than `climate=kalt%2Cfrostig`) — safe here because every value in play
 * (preset ids, dates, variable option values) comes from our own fixed,
 * comma-free vocabulary, never free-form user text.
 */
export function tripSelectionToQueryString(selection: TripSelection): string {
  const parts = [
    `activities=${selection.presetIds.map(encodeURIComponent).join(',')}`,
    `start=${encodeURIComponent(selection.startDate)}`,
    `end=${encodeURIComponent(selection.endDate)}`,
  ];
  for (const variable of allClaimedVariables()) {
    const values = selection.vars[variable.id] ?? variable.default;
    parts.push(`${variable.id}=${values.map(encodeURIComponent).join(',')}`);
  }
  return parts.join('&');
}
