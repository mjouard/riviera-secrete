# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Riviera Secrète — a static site (no framework, no server) listing 30 lesser-known spots
("lieux") on the French Riviera (Menton → Saint-Tropez), grouped into 6 day-trip
itineraries ("itinéraires"). Deployed to Netlify (`riviera-secrete.netlify.app`), French
content throughout.

## Commands

```bash
node scripts/build.mjs      # or: npm run build
```

Regenerates every file in `lieux/*.html` and `itin/*.html` from `data/lieux.json` and
`data/itineraires.json`. **Run this after any edit to those JSON files** — it's the only
way changes reach the actual pages. There is no lint/test suite.

To preview locally: `.claude/launch.json` defines a `static` config (`python3 -m
http.server`) usable with the Browser tool's `preview_start`.

## Architecture: data model, not templates-over-nothing

The object hierarchy is: **Itinéraire → Lieux → Activités**, where a Lieu is a physical
place (village, trail, monument…) and owns its Activités. This is real in the data, not
just conceptual:

- **`data/lieux.json`** — source of truth for the 30 lieux. Each lieu owns an `activites[]`
  array (`id`, `nom`, `badge` (`gratuit`/`payant`), `duree`, `prix`, `url`, `image`, `alt`,
  `linkText`). Price/duration/url/image for a given activité exist **only here**.
- **`data/itineraires.json`** — the 6 itinéraires. Each `stop` item references a lieu by
  `lieuSlug`; its pills and the "à réserver" booking cards reference an activité by
  `{ lieuSlug, activiteId }` — never by copying its price/duration/url/image. Only a
  display-layer override lives on the itinéraire side (pill `label`, booking card
  `nomLabel`/`lieuLabel`, optional `extraSpans`/custom `linkText`). At render time
  `scripts/render/itin.mjs` looks up the referenced activité in `lieuBySlug` and pulls the
  real facts from there; the itinerary map's `STOPS` array (lat/lng per stop) is likewise
  computed from the referenced lieu's coordinates, never stored separately.
- **`lieux/*.html`** and **`itin/*.html`** are generated output — **never hand-edit them**,
  edits get silently overwritten by the next build. Edit the JSON and rebuild instead.
- `scripts/render/lieu.mjs` / `scripts/render/itin.mjs` hold the HTML templates (plain JS
  template literals, no templating engine/dependency).
- `scripts/extract-lieux.mjs` / `scripts/extract-itineraires.mjs` were the one-time
  regex-based extraction used to bootstrap the JSON from the original hand-authored HTML.
  Re-running them would overwrite any hand-edits made directly to the JSON since — treat
  them as historical/bootstrap tools, not part of the normal edit loop.

A lieu's `related` cards (other lieux to discover) and an itinéraire's `suggestions` cards
(other itinéraires) are stored as raw extracted snapshots, **not** cross-referenced against
each other's live data — that duplication was intentionally left alone (lower stakes, lower
risk) when the data model above was introduced.

**Known gap, not yet covered by this data model:** `index.html` and `carte.html` each embed
their own independent copy of every lieu's name/commune/lat/lng/intro/thumbnail as inline
JS arrays (`SPOTS_MAP_HOME`, `SPOTS_MAP_FULL`) plus a JSON-LD `ItemList`. These are not
generated from `data/lieux.json` — editing a lieu's name or coordinates in the JSON does
**not** propagate there; those two files still need manual updates in sync until this is
folded into the build.

## Custom skills

- **`/add-activities`** — adds an activité to a lieu's `activites[]` in `data/lieux.json`,
  then builds.
- **`/build-itinerary`** — enriches an itinéraire in `data/itineraires.json` (pills, transit
  blocks, sleep markers, "à réserver" selection, geographic/timing coherence), then builds.

Both operate on the JSON and end with a build — see each command file under
`.claude/commands/` for the full ruleset (pill/label formatting conventions, day-rhythm
philosophy for itineraries, etc.).

## Content conventions worth knowing

- Every lieu page carries a Leaflet mini-map and a `TouristAttraction` JSON-LD block; every
  itinéraire page carries a full Leaflet route map — both driven by lat/lng already present
  in `data/lieux.json`.
- Hero images: most lieux still use `picsum.photos` placeholders rather than real photos
  (tracked in `ROADMAP.md`); a lieu with real photography sets `heroSlides` (int) so
  `main.js`'s carousel picks up `hero.jpg`, `hero-2.jpg`, … from
  `assets/images/lieux/<slug>/`. An itinéraire hero can instead carry a literal
  `data-carousel-srcs` attribute listing multiple lieu hero images — stored verbatim as
  `heroImgTag` in `data/itineraires.json` rather than modeled as structured data.
- `<title>` tags use a bare `&`; everything else (h1, breadcrumbs, alt text) uses `&amp;` —
  the render templates already handle this split, don't "fix" one to match the other.
