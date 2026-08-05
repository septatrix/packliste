# Packliste

A client-side web app for creating interactive travel/vacation packing lists.
Pick an activity preset (Skifahren, Wandern, Sommerlager, …) plus trip
parameters — start/end date (the duration is computed automatically),
climate, mode of travel, destination scope (inland / EU-Schengen /
international), gender — and get a checklist with per-item quantities
computed for your trip, shown with a small icon per item for quick scanning.
Track each item as *offen*, *eingepackt*, *nicht benötigt*, or *für morgen*
(things still needed that get collected on a separate "grab before leaving"
list), and override the computed quantity per item if you want to pack a
different amount than suggested. All state is written to `localStorage`;
there is no backend — the whole app is a static site. The list itself
renders as a print-like two-column layout (A4 width as the reference point)
that collapses to one column on narrow screens, and has a dedicated print
stylesheet (checkbox glyphs, no interactive chrome) for printing the list
on paper.

**Stack:** [Astro](https://astro.build) (static output) +
[Vue 3.6](https://vuejs.org) + plain CSS. Components are written with
`<script setup vapor>` to opt into Vue's new Vapor compiler where the
toolchain supports it (see [Vapor mode](#vapor-mode) below).

## Setup

```sh
pnpm install
pnpm dev       # dev server
pnpm build     # static build to dist/
pnpm preview   # serve the production build locally
```

## Presets

Presets are **plain TypeScript modules** under `src/presets/`, not
declarative data files. Each preset exports a `PresetDefinition` (see
`src/lib/schema.ts`):

```ts
interface PresetDefinition {
  id: string;
  name: string;
  description?: string;
  resolveItems(params: Params): Item[];
}
```

`resolveItems` receives the chosen trip parameters (`climate`, `days`,
`travel`, `destination`, `gender`, …) and returns the list of items with
their category, importance (`pflicht` | `optional`), quantity (a fixed
number, or a `{ min, max }` range), and an optional `icon` (a single emoji;
falls back to a per-category default if omitted — see `CATEGORY_ICONS` in
`src/lib/engine.ts`). Because it's just a function, a preset author has the
full language available — loops, conditionals, arithmetic — instead of a
fixed rule vocabulary:

```ts
resolveItems(params) {
  const items: Item[] = [
    { id: 'ski-skisocken', name: 'Skisocken', category: 'Kleidung', importance: 'pflicht',
      quantity: perDay(1, params.days) },      // per-day quantity
    { id: 'ski-muetze', name: 'Warme Mütze', category: 'Kleidung', importance: 'pflicht',
      quantity: { min: 1, max: 2 } },           // range quantity
  ];

  if (params.climate === 'frostig') {
    items.push({ id: 'ski-handwaermer', name: 'Handwärmer', category: 'Ausrüstung',
      importance: 'optional', quantity: perDay(1, params.days, 10) }); // capped
  }

  return items;
}
```

`src/presets/helpers.ts` has small helpers (`perDay`, `perDayRange`) for
scaling a quantity by trip length with an optional cap; using them is
optional. Gender-specific items are just an `if (params.gender === ...)`
inside `resolveItems` — there's no separate `gender` field on `Item`.

Presets never deal with dates — the user picks a start/end date in
`ParameterForm`, and `deriveParams()` (`src/lib/schema.ts`) turns that into
the `Params.days` a preset sees, computed inclusively of both endpoints
(`daysBetweenInclusive` in `src/lib/dates.ts`; picking the same day twice
still counts as 1 day). `Params` itself is unchanged either way — a preset
author never needs to touch date logic.

There's always a `base` preset (`src/presets/base.ts`) merged in regardless
of the chosen activity — universal essentials like documents, chargers, and
destination-dependent items (passport/visa/adapter/currency for
international trips, liquids reminder for flights, etc.).

**Adding a preset:** create `src/presets/<id>.ts` exporting a
`PresetDefinition` as its default export, then register it in
`src/presets/index.ts`'s `activityPresets` array.

The output of every `resolveItems()` call is validated at runtime against
`ItemSchema` (Zod) in `src/lib/engine.ts`, so a malformed preset fails loudly
with a clear error instead of silently corrupting the list.

### Validating presets

```sh
pnpm validate:presets
```

Runs every registered preset's `resolveItems()` across a full matrix of trip
parameters (climate × travel × destination × gender × several day counts) and
checks for thrown exceptions, schema violations, and duplicate item IDs
between presets. Useful as a quick regression check after editing a preset.

## Architecture

- `src/lib/schema.ts` — Zod schemas and types shared by presets and the app:
  `TripSelection` (what the user picks — including `startDate`/`endDate`,
  persisted as-is), `Params`/`deriveParams()` (what presets consume, with
  `days` computed from the dates), `Item`, `Quantity`, category/importance
  /climate/etc. enums, `ItemState` for the four-way checklist state,
  `ItemProgress` for a per-item `{ state, amount }` pair.
- `src/lib/dates.ts` — small ISO-date (`yyyy-mm-dd`) helpers: `todayIso`,
  `addDays`, `daysBetweenInclusive`, all parsed at UTC midnight so calendar
  math isn't affected by the browser's local timezone.
- `src/lib/engine.ts` — `resolveList(params, presets)` runs each preset's
  `resolveItems`, validates the output, resolves each item's icon (its own
  or the category fallback), and groups items by category in a fixed
  display order.
- `src/lib/storage.ts` — `localStorage` persistence for the trip selection
  (dates included) and per-item progress (`{ state, amount }`).
- `src/presets/` — the preset modules described above.
- `src/components/` — `PackingApp.vue` (root island) → `ParameterForm.vue`
  (trip parameters, including the start/end date pickers) + `PackingList.vue`
  → `ItemRow.vue` (per-item icon, editable amount, and four-way state
  control) + `TomorrowList.vue` ("für morgen" aggregation).

### Packed-amount override

Each item's `quantity` (fixed or range) is only a *suggestion* — `ItemRow`
shows it as the number input's tooltip and default value (the range's max),
but the number itself is freely editable and stored per item in
`ItemProgress.amount`, independent of the four-way state. This lets someone
decide "the preset suggests 1–2, but I'm only bringing 1" without that
being conflated with whether the item is packed yet.

## Printing

`src/styles/global.css` has a `@media print` block (plus `@page { size: A4;
margin: 12mm; }`) so the list prints as an actual paper checklist rather
than a screenshot of the UI:

- Forces a plain black-on-white palette regardless of the viewer's theme or
  OS dark-mode preference (printing a dark background wastes toner, and it
  isn't guaranteed to render as intended anyway).
- Hides the four-way state buttons (meaningless on paper) and replaces each
  item row with a `☐` checkbox glyph via `::before`, so the printout is a
  real pen-and-paper checklist.
- Item names switch from single-line ellipsis truncation to wrapping, since
  there's no hover tooltip on paper to reveal a cut-off name.
- The parameter form prints as a plain bold-text summary of the chosen trip
  (activity, dates, climate, …) instead of interactive form controls.
- The two-column layout is kept for print (`break-inside: avoid` on
  categories/rows so nothing splits awkwardly across the column or a page
  break).

## Vapor mode

Vue 3.6 (currently an RC) ships Vapor mode: components can compile to direct
DOM operations without the virtual DOM. This project pins `vue@3.6.0-rc.2`
and marks components with `<script setup vapor>` to compile them that way.

At the time of writing, `@astrojs/vue`'s client hydration bootstraps the
island via `createSSRApp`/`createApp`, and mounting a Vapor-compiled root
through that path fails at runtime (`Cannot read properties of undefined
(reading 'hydrate')`) — a vdom/Vapor interop gap in this specific
integration version. Because this app's state fundamentally depends on
`localStorage` (unavailable during server prerendering anyway), the island
is mounted with `client:only="vue"` in `src/pages/index.astro`, skipping
Astro's SSR/hydration path entirely and mounting fresh on the client — which
works correctly with Vapor components.

If a future `@astrojs/vue` release fixes the SSR/hydration interop, this
project can likely go back to `client:load` without touching the components
themselves. If Vapor mode ever needs to be disabled instead, simply drop the
`vapor` keyword from each `<script setup vapor lang="ts">` tag — the
Composition API code inside is unaffected either way.
