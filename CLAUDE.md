# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Riviera Secrète — a static site (no framework, no server) listing 27 lesser-known spots
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

- **`data/lieux.json`** — source of truth for the 27 lieux. Each lieu owns an `activites[]`
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

**A lieu must never appear as an "activité" of another lieu.** If something in a lieu's
`activites[]` is itself one of the 27 lieux (own slug, own page) rather than a bookable
visit/tour *inside* that lieu, it belongs in `related[]`, not `activites[]`. This was the
single largest source of duplicated/drifting data found in the original dataset (e.g. "Villa
Ephrussi de Rothschild" and "Village médiéval de Roquebrune" were each listed as a plain
"activité" of a neighboring lieu, instead of being cross-linked as the lieux they are) — see
`/add-activities`' rules for the check to run before adding a new activité.

The reverse move has happened three times now: `sentier-nietzsche-eze` and
`villa-ephrussi-rothschild` (demoted onto `eze-village` and `sentier-cap-ferrat`), then
`chapelle-rosaire-vence` (demoted onto `saint-paul-de-vence` — its nearest lieu, not same
commune but the previous/adjacent stop in the `villages-perches` itinerary; all 3 of its
activités moved over, and its `randonnee` badge — Baous de Vence hike — followed with them).
None were really independent destinations. **This is only partly automated** — running the
build regenerates `index.html`'s map, card grid, and JSON-LD `ItemList` (see below) from
whatever's in `data/lieux.json`, but `sitemap.xml` and `ROADMAP.md`'s placeholder-image count
still need hand-editing every time a lieu is added/removed/demoted. If the demoted lieu was
also a standalone stop in an itinéraire (as the chapel was), that stop has to be merged into
the adjacent one — pills moved over, transit/timing adjusted — rather than just repointed,
and any `itin-suggest`/`itin-preview` card elsewhere quoting that itinéraire's old étape
count needs the same fix (`data/itineraires.json`'s own `suggestions[]` arrays are raw
snapshots too, see "known duplication" above — search for every copy). If a lieu ever needs
demoting again, expect the same manual sweep, and check the current lieu count instead of
trusting any number written in this file.

**Badges vs activités.** A lieu also has `badges: string[]` — generic tags from a fixed
vocabulary (`BADGE_DEFS` in `scripts/render/lieu.mjs`: `plage`, `randonnee`, `vtt`,
`plongee`, `restaurant`) declaring what's *practicable* at that lieu, as opposed to
`activites[]` which are unique, bookable things that exist at exactly one lieu ("Le Jardin
exotique" only exists at `eze-village`). All 27 lieux have at least one badge
(WebSearch-verified, 2026-08-27) — the one that had none (`chapelle-rosaire-vence`) is the
lieu that got demoted into `saint-paul-de-vence` above, which is itself a strong signal worth
reusing: a lieu with zero practicable badges is a candidate for demotion into an activité of
a nearby lieu, not a standalone destination. A badge
means the activity is practicable *at that specific lieu's location*, not just somewhere in the
same commune: `eze-village` is the perched village at ~400m, so it does **not** carry `plage`
or `plongee` even though the Èze commune has a beach and diving nearby — those are down at
Èze-sur-Mer, a different physical place. Same reasoning excluded `plage`/`plongee` from
`sentier-corbusier-cap-martin` (swimming signposted as prohibited along most of that specific
path) while `roquebrune-cap-martin-village` — a ~10min walk from the same beaches — keeps
`plage`. Don't add a badge from memory/assumption; verify it's actually practicable at that
lieu (WebSearch when uncertain) before adding or changing one. `BADGE_DEFS` and the pill renderer
live in `scripts/render/lieu.mjs` and are imported into `scripts/render/itin.mjs`
(`renderBadgePills`) so an itinéraire stop shows the referenced lieu's own badges — same
single-source rule as everything else here, no per-itinéraire badge data.

**`index.html` is hand-authored HTML with three generated blocks injected in place** by
`build.mjs`, each via its own regex-replace guarded to throw (not silently no-op) if the
marker it expects isn't found:
- The homepage map's `const SPOTS_MAP_HOME = [...]` — from `scripts/render/home-map.mjs`'s
  `buildSpotsMapHome(lieux)`.
- The JSON-LD `"itemListElement": [...]` in `<head>` — from `home-lieux.mjs`'s
  `buildItemList(lieux)`.
- The five `<section class="region-section">…</section>` blocks under `#lieux` — from
  `home-lieux.mjs`'s `buildRegionSectionsHtml(lieux)`, one call per region in
  `REGION_ORDER` (`menton-monaco, nice, arriere-pays, antibes-cannes, golfe-st-tropez`).

**`data/lieux.json`'s array order is the canonical display order** (grouped by region,
sequenced within each region) — this is what both the card grid and the JSON-LD `ItemList`
render in, and what the `region-count` per section is computed from (`lieux.length` after
filtering to that `regionSlug`, not a stored number). Insert a new lieu at the position you
want it to appear, not just anywhere.

Every lieu also has `thumbImage` — a dedicated small-format image (real `thumb.jpg` where a
lieu has real photography, otherwise a `picsum.photos/…/500/375` placeholder) distinct from
`heroImage` (used for the lieu page's own detail-hero, `1200×800`/carousel). Both the map
popup and every grid card use `thumbImage`; card `alt` text reuses `heroAlt` (verified
identical for all 27 before switching over — if a future lieu's grid alt should read
differently from its hero alt, that'll need a real `cardAlt` field, there isn't one yet). The
grid's `<p>` blurb is a 95-char truncation of `description` (100 for the map's popup `intro`)
computed at build time, not stored — two different lengths for two different card sizes, same
source text.

`color` per card badge/dot is derived from `regionSlug` via a small 5-entry enum in
`home-map.mjs` — keep it in sync with the filter-button dot colors hand-authored in
`index.html`'s own HTML/CSS if either ever changes.

No known gap left in `index.html` itself. Two more places still hardcode "27" and would need
updating if the lieu count changes again: `sitemap.xml` (one `<url>` block per lieu) and
`ROADMAP.md`'s placeholder-image tally.

## Site structure (2026-08-27)

There is no standalone full-screen map page or itinéraires hub page anymore — both were
removed as redundant intermediates (`index.html` already embeds the full interactive map at
`#carte` and the full itinéraire grid in its `itin-preview` section — which itself has
`id="itineraires"` — each already linking straight to `lieux/*.html`/`itin/*.html`). Don't
recreate `carte.html` or `itineraires.html`. Site nav is now: `index.html` has "Carte" (→
`#carte`), "Itinéraires" (→ `#itineraires`), "Lieux" (→ `#lieux`), all anchors on itself;
every other page (`lieux/*.html`, `itin/*.html`, `credits.html`) has "Itinéraires" (→
`../index.html#itineraires`) and "Lieux" (→ `../index.html#lieux`) — no "Carte" equivalent to
link to from a subpage, so that one was dropped rather than repointed. Itinéraire page
breadcrumbs go straight `Accueil → [titre]`, no middle "Itinéraires" crumb.

**Itinéraire → lieu breadcrumb context.** When a stop's lieu link is generated
(`scripts/render/itin.mjs`), it carries `?itin=<slug>`. On the lieu page
(`scripts/render/lieu.mjs`), a small inline script reads that query param against an embedded
`ITIN_TITLES` map (slug → titre, built in `build.mjs` from `data/itineraires.json`, HTML
entities decoded) and, if it matches, swaps the breadcrumb's middle crumb from the lieu's
region (`id="breadcrumb-parent"`) to a link back to that itinéraire — so following a stop
link and then going "back" returns to the itinéraire, not to the homepage's region list.
Falls back to the normal region crumb whenever the param is absent or unrecognized (direct
visits, search traffic, links from the homepage grid, etc.) — this is additive, not a
replacement of the default breadcrumb.

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
- Every lieu page also has a "Google Maps / Waze / Plans" link row (`renderMapLinks`,
  exported from `scripts/render/lieu.mjs`, right under the mini-map) built from the same
  `lat`/`lng` — no per-lieu URL is ever stored, all three are constructed from coordinates at
  render time. Itinéraire stops reuse the exact same `renderMapLinks`, one row per stop —
  **not** one combined multi-stop button for the whole trip: Google Maps supports a real
  multi-waypoint route via URL, but Waze and Apple Maps have no official multi-stop URL
  scheme (only "navigate to one point"), so a single "open the itinéraire" button couldn't
  honestly work the same way on all three. Per-stop links sidestep that; itinéraire pages
  additionally carry one `.itin-open-map` button (`buildGoogleMapsRouteUrl` in
  `scripts/render/itin.mjs`, right under the meta-bar) that opens the *whole trip* as a
  Google Maps multi-stop route — origin/destination/waypoints built from the `stop` items'
  lieux in order, sleep markers skipped (they carry no coordinates of their own). Google
  Maps only; don't add a matching Waze/Plans button next to it; that's the whole reason the
  per-stop links exist instead.
- Hero images: most lieux still use `picsum.photos` placeholders rather than real photos
  (tracked in `ROADMAP.md`); a lieu with real photography sets `heroSlides` (int) so
  `main.js`'s carousel picks up `hero.jpg`, `hero-2.jpg`, … from
  `assets/images/lieux/<slug>/`. An itinéraire hero can instead carry a literal
  `data-carousel-srcs` attribute listing multiple lieu hero images — stored verbatim as
  `heroImgTag` in `data/itineraires.json` rather than modeled as structured data.
- `<title>` tags use a bare `&`; everything else (h1, breadcrumbs, alt text) uses `&amp;` —
  the render templates already handle this split, don't "fix" one to match the other.
