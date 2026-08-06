# Packliste

A client-side web app for creating interactive travel/vacation packing lists.
Pick one or more activity presets (Skifahren, Wandern, Sommerlager, Camping,
Segeln, Motorradtour) — a trip can combine several, e.g. skiing *and* a
swimming pool visit on the same vacation — plus trip parameters: start/end date (the duration is
computed automatically), one or more climates (e.g. a destination with both
hot days and cold nights), mode of travel, destination scope (inland /
EU-Schengen / international), gender. Travel/destination/gender can be left
as "keine Angabe"; activities and climate can have none, one, or several
selected at once — with zero activities picked, the universal base
essentials still show, since those don't depend on an activity. Get a
checklist with per-item quantities computed for your trip, shown with a
small icon per item for quick scanning and an ⓘ info icon revealing which
preset an item came from and how its quantity was computed. Track each
item as *offen*, *eingepackt*, *nicht benötigt*, or *für morgen* (things
still needed that get collected on a separate "grab before leaving" list),
and override the computed quantity per item if you want to pack a
different amount than suggested. All state is written to `localStorage`;
there is no backend — the whole app is a static site. The list renders as
a plain table (flush rows, alternating background, no per-item "card"
look) in a print-like two-column layout (A4 width as the reference point)
that collapses to one column on narrow screens, with a dedicated print
stylesheet — checkbox glyphs, the alternating row colors preserved, no
interactive chrome — for printing the list on paper. A "Presets ansehen"
button opens a modal with the actual (syntax-highlighted) source of every
preset, for anyone curious what a preset really does.

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
`travel`, `destination`, `gender`, `presetIds`, …) and returns the list of
items with their category, importance (`pflicht` | `optional`), quantity (a
fixed number, or a `{ min, max }` range), and an optional `icon` (a single
emoji; falls back to a per-category default if omitted — see
`CATEGORY_ICONS` in `src/lib/engine.ts`). Because it's just a function, a
preset author has the full language available — loops, conditionals,
arithmetic — instead of a fixed rule vocabulary:

```ts
resolveItems(params) {
  const items: Item[] = [
    { id: 'ski-skisocken', name: 'Skisocken', category: 'Kleidung', importance: 'pflicht',
      quantity: perDay(1, params.days) },      // per-day quantity
    { id: 'ski-muetze', name: 'Warme Mütze', category: 'Kleidung', importance: 'pflicht',
      quantity: { min: 1, max: 2 } },           // range quantity
  ];

  if (params.climate.includes('frostig')) {
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

### Multi-select activities and climate

`presetIds` and `climate` are both arrays on `Params`/`TripSelection`, not
single values — a trip can combine several activities (skiing *and* a
swimming-pool visit on the same vacation) and several climates (hot days,
cold nights), and the resulting list is simply the union of whatever each
selected value implies. `PackingApp.vue` resolves this by merging `base`
with *every* matched preset in one `resolveList()` call — `engine.ts` itself
was already written to merge an arbitrary list of presets, so no engine
changes were needed, only threading an array through the UI/schema layer.
`ParameterForm.vue` renders both as a row of toggle chips (checkboxes styled
as pills) rather than a `<select>`, since more than one can be active.

An empty `climate`/`presetIds` array is "keine Angabe" — no toggle chip
active. For `climate`, a plain `params.climate.includes('warm')` check is
already `false` for an empty array, so "no climate selected" naturally
means "include none of the climate-conditional items", the same way it did
before climate became an array. For `presetIds`, an empty array just means
no *activity-specific* items are added — `PackingApp.vue` always merges
`base` regardless (`resolveList(deriveParams(tripSelection), [base,
...selectedPresets])`, unconditionally), so the universal essentials are
never gated behind picking an activity; a non-blocking hint above the list
suggests picking one for more.

Because activities can now be combined freely, `validate-presets.ts` tests
every non-empty *subset* of registered activity presets (not just each one
individually) merged with `base`, to catch item-id collisions between two
different activity presets that would only surface when both are selected
together.

### "Keine Angabe" (no selection)

`travel`, `destination`, and `gender` are optional on `Params` — the user
can leave any of them unset instead of picking a value. There's no single
rule for what "unset" means; it's a per-field, per-branch decision left to
each preset's plain conditionals:

- **travel / destination default to exclusive.** A plain
  `params.travel === 'flugzeug'` check is already `false` when `travel` is
  `undefined`, so an unset value naturally means "include none of the
  conditional items for this dimension" with no extra code. The one thing
  to watch for is a *negated* check like `!== 'inland'`, which is `true` for
  `undefined` and would wrongly include a destination-tier item — those
  need an explicit `params.destination !== undefined && ...` guard (see
  `base.ts`).
- **gender defaults to inclusive.** An unset gender means "show every
  gender-specific variant" (the user can decide/skip what doesn't apply),
  which is the opposite default — so gender checks use the
  `matchesGender(params.gender, target)` helper from `presets/helpers.ts`
  (`gender === undefined || gender === target`) instead of a plain
  equality check. `sommerlager.ts`'s "Nachtzeug Jungen"/"Nachtzeug Mädchen"
  split is the clearest example: unset gender shows both variants,
  `divers` shows neither, `maennlich`/`weiblich` show just their own.

A new preset should apply the same judgment per field it conditions on —
there's no framework-level switch to flip.

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

Two passes, deliberately not one exhaustive cross product — which item ids
a preset can produce doesn't depend on the specific parameter *values*
(ids are static strings), so crossing every preset *subset* with the full
parameter matrix would be wasted work that gets exponentially slower with
every new preset (`2^presets`):

1. Every individual activity preset (merged with `base`) against the full
   parameter matrix — every climate subset (the powerset of all 4 values,
   including "none") × travel × destination × gender × several day counts,
   the latter three including `undefined`/"keine Angabe" — catching thrown
   exceptions and schema violations. ~24,600 combinations.
2. Every non-empty *subset* of activity presets (all `2^presets - 1` of
   them, so this part does scale with preset count, but cheaply) against a
   handful of parameter profiles chosen to each maximize which conditional
   items are active — catching item-id collisions between two presets that
   only surface when both are selected together.

Runs in a few seconds regardless of how many presets are registered.
Useful as a quick regression check after editing a preset.

## Architecture

- `src/lib/schema.ts` — Zod schemas and types shared by presets and the app:
  `TripSelection` (what the user picks — including `startDate`/`endDate`,
  persisted as-is), `Params`/`deriveParams()` (what presets consume, with
  `days` computed from the dates), `Item`, `Quantity`, category/importance
  /climate/etc. enums, `ItemState` for the four-way checklist state,
  `ItemProgress` for a per-item `{ state, amount }` pair. `presetIds` and
  `climate` are arrays (multi-select); `travel`/`destination`/`gender` are
  single optional values.
- `src/lib/dates.ts` — small ISO-date (`yyyy-mm-dd`) helpers: `todayIso`,
  `addDays`, `daysBetweenInclusive`, all parsed at UTC midnight so calendar
  math isn't affected by the browser's local timezone.
- `src/lib/engine.ts` — `resolveList(params, presets)` runs each preset's
  `resolveItems`, validates the output, resolves each item's icon (its own
  or the category fallback), records which preset produced it
  (`sourceId`/`sourceName`, for the info icon) and groups items by category
  in a fixed display order.
- `src/lib/storage.ts` — `localStorage` persistence for the trip selection
  (dates included) and per-item progress (`{ state, amount }`).
- `src/presets/` — the preset modules described above.
- `src/components/` — `PackingApp.vue` (root island) → `ParameterForm.vue`
  (trip parameters, including the start/end date pickers and the
  activity/climate toggle-chip groups) + `PackingList.vue` → `ItemRow.vue`
  (per-item icon, editable amount, and four-way state control) +
  `TomorrowList.vue` ("für morgen" aggregation).

### Packed-amount override

Each item's `quantity` (fixed or range) is only a *suggestion* — `ItemRow`
shows it as the number input's tooltip and default value (the range's max),
but the number itself is freely editable and stored per item in
`ItemProgress.amount`, independent of the four-way state. This lets someone
decide "the preset suggests 1–2, but I'm only bringing 1" without that
being conflated with whether the item is packed yet.

Once the number differs from that default (`item.quantityMax`), `ItemRow`
adds an `item-amount-overridden` class: a thicker accent-colored border and
bold accent-colored text on screen, or just a plain accent-colored
underline for print (consistent with the no-outline booktabs style —
`.item-amount { border: none }` in the print stylesheet would otherwise
strip it, so `.item-amount.item-amount-overridden` re-adds a
`border-bottom` at higher specificity). Reverting the value back to the
default removes the highlight again.

### Item provenance (the ⓘ info icon)

Every item has a small ⓘ icon (`ItemRow.vue`) whose tooltip shows which
preset produced it (`item.sourceName`, tracked per-item in `resolveList()`)
and, when present, `item.note` — a short human-readable explanation of how
the quantity was computed. `Item.note` is optional and author-supplied, not
reconstructed after the fact (guessing from the resolved number would risk
showing a wrong explanation): presets add it alongside a `perDay`/range
call, e.g. `perDayNote(1, params.days, 8)` → `"1 pro Tag × 7 Tage, gedeckelt
bei 8"`, or `rangeNote(1, 2)` → `"Frei wählbar zwischen 1 und 2"` (both in
`presets/helpers.ts`). Items with a plain fixed quantity and no interesting
calculation just show their source preset, which is still useful ("why is
this in my list?").

## Preset inspector

The "📜 Presets ansehen" button (`PackingApp.vue`) opens `PresetInspector.vue`,
a modal with one tab per registered preset (base + every activity preset)
showing its actual `.ts` source, syntax-highlighted.

The highlighting happens entirely at **build time**, not in the browser:
`src/pages/index.astro`'s frontmatter uses `import.meta.glob('../presets/*.ts',
{ eager: true, query: '?raw', import: 'default' })` to pull in every preset
file's raw source (matched to a preset by filename, so a newly added preset
shows up automatically — no third place to register it beyond `presets/index.ts`),
runs each through [Shiki](https://shiki.style)'s `codeToHtml()` with a dual
light/dark theme (`github-light`/`github-dark`), and passes the resulting
HTML strings to `PackingApp` as a prop. This means zero Shiki runtime cost in
the client bundle — the modal just renders pre-built HTML via `v-html`
(trusted, since it's our own bundled source, not user input).

Shiki's dual-theme output encodes the light theme as each token's plain
`color`/`background-color`, with the dark variant available via
`--shiki-dark`/`--shiki-dark-bg` CSS custom properties. `global.css` swaps to
those variables under the same conditions used everywhere else in the app
(OS `prefers-color-scheme: dark`, unless overridden to light; or an explicit
`data-theme="dark"` override, regardless of OS).

## Table layout: booktabs, not boxes

Each category renders as a table styled after LaTeX's `booktabs` package
rather than a bordered/rounded "card" or a full grid of cell borders: no
outline around the table, no rule between every row — just a heavy rule
above the header (`\toprule`), a light rule below it (`\midrule`), and a
heavy rule closing the table (`\bottomrule`). Row separation comes entirely
from alternating backgrounds (`:nth-of-type(even)` on `.item-row`, using a
dedicated `--color-zebra-bg` variable rather than reusing the page
background, so it stays visually distinct in both themes and survives the
print color overrides below) — no per-row lines needed on top of that. The
four-way state, which used to fill the whole row with a tinted background,
is a 3px left-edge accent stripe instead, keeping it glanceable without
adding another border. On screen, `.category` gets an optional soft
`box-shadow` (a `--shadow-elevation` variable, `none` in dark mode where
shadows don't read well against a dark page, and always `none` for print)
if a category needs to visually separate from the page — an alternative to
an outline, not a replacement rule structure.

## Printing

`src/styles/global.css` has a `@media print` block (plus `@page { size: A4;
margin: 12mm; }`) so the list prints as an actual paper checklist rather
than a screenshot of the UI:

- Forces a plain black-on-white palette regardless of the viewer's theme or
  OS dark-mode preference (printing a dark background wastes toner, and it
  isn't guaranteed to render as intended anyway) — **except** the zebra
  stripe, which is deliberately forced to a visible light gray instead of
  white, since alternating rows are the whole point of a printed table.
  `print-color-adjust: exact` on `.item-row` ensures the stripe actually
  prints instead of being suppressed by the browser's default
  no-backgrounds print economy mode. `--shadow-elevation` is forced to
  `none` — no shadow (and no outline in the first place) on paper, only
  the booktabs-style rules.
- Hides the four-way state buttons (meaningless on paper) and replaces each
  item row with a `☐` checkbox glyph via `::before`, so the printout is a
  real pen-and-paper checklist.
- Hides the ⓘ info icon — it's a hover affordance with nothing to hover on
  paper.
- Item names switch from single-line ellipsis truncation to wrapping, since
  there's no hover tooltip on paper to reveal a cut-off name.
- The parameter form prints as a plain bold-text summary of the chosen trip
  (activities, dates, climates, …) instead of interactive form controls.
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
