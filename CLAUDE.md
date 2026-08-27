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

- **`data/lieux.json`** — source of truth for the 27 lieux, including `lat`/`lng`
  (WebSearch-verified against real-world coordinates, 2026-08-27 — 3 were found off by
  2–6km and corrected: `peille-village`, `peillon-village`,
  `roquebrune-cap-martin-village`; if you ever add a lieu, verify its coordinates the same
  way rather than eyeballing a map). Each lieu also owns an `activites[]` array (`id`,
  `nom`, `badge` (`gratuit`/`payant`), `duree`, `prix`, `url`, `image`, `alt`, `linkText`).
  Price/duration/url/image for a given activité exist **only here**. `metaPills` holds only
  the saison/durée/niveau pills — the 📍 coordinates pill is never stored, always computed
  from `lat`/`lng` at render time (`renderMetaPills` in `scripts/render/lieu.mjs`), so a
  coordinate fix can't leave a stale duplicate displayed anywhere.
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
`#carte`), "Itinéraires" (→ `#itineraires`), "Lieux" (→ `#lieux`), all anchors on itself,
plus "Mes itinéraires" (→ the root-level page below); every other page (`lieux/*.html`,
`itin/*.html`, `credits.html`, `creer-itineraire.html`, `mes-itineraires.html`) has
"Itinéraires" (→ `../index.html#itineraires` or `index.html#itineraires`), "Lieux" and the
same "Mes itinéraires" link — no "Carte" equivalent to link to from a subpage, so that one
was dropped rather than repointed. "Créer un itinéraire" is deliberately **not** in the nav
— it lives as a CTA card (`.itin-create-cta`) under the 6 preset itinéraires on the homepage
instead, so it reads as one of the itinerary options rather than a persistent utility link
like "Mes itinéraires". Itinéraire page breadcrumbs go straight `Accueil → [titre]`, no
middle "Itinéraires" crumb. The nav `<a>` markup (plus the `.nav-toggle` hamburger button,
see below) is duplicated in 6 places — `index.html`, `credits.html`, `creer-itineraire.html`,
`mes-itineraires.html`, and the `<nav>` block inside `scripts/render/lieu.mjs` and
`scripts/render/itin.mjs` — change all 6 together and rebuild.

**Mobile nav.** Below 700px the pill-style nav (`header nav a`) doesn't fit next to the logo
— it used to force the "Côte d'Azur" logo onto 2 lines, which overflowed the fixed-height
sticky header and visually collided with the page content underneath (found via a mobile
audit, fixed 2026-08-28). Under that breakpoint, `header nav` is hidden and a `.nav-toggle`
(☰) button — present in all 6 header copies above — toggles a `.is-open` class that turns
the nav into a full-width dropdown panel with stacked, full-height-tap-target links. The
toggle JS lives in `assets/main.js` (one shared listener keyed off `.nav-toggle`, closes the
panel on any link click), so any page using this header pattern must load `assets/main.js`
— `credits.html`, `creer-itineraire.html` and `mes-itineraires.html` didn't originally and
had it added specifically for this.

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

## Créateur d'itinéraire à la volée (client-side, no build step)

`creer-itineraire.html` and `mes-itineraires.html` (root-level, hand-authored like
`index.html`/`credits.html`) let a visitor compose their own itinerary — duration
(demi-journée/journée/2 jours/3 jours) + zones/lieux picked from checkboxes — and the
algorithm builds a realistic day-by-day route, editable by drag-and-drop, saved to
localStorage only on explicit "Sauvegarder". This is a deliberate second subsystem
alongside the `data/*.json` → `build.mjs` → static HTML pipeline documented above: these
itinéraires are user-generated and ephemeral, not editorial content, so nothing here is
generated by the build.

- **`assets/itineraire-data.js`** — pure logic (no DOM), loaded on both pages. Fetches
  `data/lieux.json` directly (`fetch('data/lieux.json')` — served as-is by Netlify, no
  duplication/copy step). `parseVisitMinutes` regex-parses the `⏱️ Durée` metaPill into
  minutes; `travelMinutes` is a haversine-distance estimate (35 km/h + 10 min fixed
  overhead per stop) — **not** a real routing call, documented as an estimate in the UI.
  `generateItineraire(candidates, dureeKey)` is the day-by-day greedy builder: starts from
  the candidate with the highest `lng` (easternmost, matching the site's existing
  Menton→Saint-Tropez ordering), then repeatedly picks the nearest not-yet-used candidate
  that still fits the current day's time budget; a day's very first stop is always accepted
  even if it alone exceeds budget (so a day is never left empty while candidates remain).
  Returns `{ days: [[lieu,...],...], excluded: [lieu,...] }` — `excluded` is what didn't fit
  and is surfaced in the UI, not silently dropped. `BADGE_DEFS` and the Google/Waze/Plans
  URL builder are duplicated here (mirroring `scripts/render/lieu.mjs`'s `BADGE_DEFS` /
  `renderMapLinks`) since there's no bundler to share a Node ESM module with the browser —
  keep both copies in sync if either changes. The `.lieu-badge`/`.map-link` **CSS**, though,
  is shared (`assets/style.css`, "BADGES & MAP LINKS" section) rather than duplicated — it
  used to live only in `lieu.mjs`'s/`itin.mjs`'s inline `<style>` blocks, which meant this
  page's own badge/link pills rendered as unstyled run-together text (found via a mobile
  audit, fixed 2026-08-28). `itin.mjs` keeps its own denser inline override on top (smaller
  pills, tighter margins, for its compact per-stop-in-a-list context) — that one's a
  deliberate variant, not a leftover duplicate, so it wasn't merged in.
- **Results width.** `.builder-results .wrap` deliberately overrides the site-wide
  `.wrap{max-width:1140px}` up to 1400px, and `.builder-days` is a
  `grid-template-columns:repeat(auto-fit, minmax(320px,1fr))` rather than a vertical stack —
  found via a desktop audit that a 3-day itinerary stacked all 3 days full-width even on a
  1920px screen, since 1140px was the ceiling regardless of monitor size (fixed
  2026-08-28). Days now sit side by side (2-up at 1400px) when there's room and collapse to
  1 column on narrow screens on their own, no separate mobile override needed. The picker
  section keeps the standard 1140px `.wrap` — it's text to read, not columns to compare.
- **Storage schema** — same no-duplication rule as `data/itineraires.json`: a saved entry
  is only `{ id, nom, dureeKey, days: [[lieuSlug,...],...], createdAt }`, never a lieu's
  name/image/coords/durée. Everything else is re-hydrated from `data/lieux.json` by slug at
  render time. `localStorage` key: `riviera-secrete:itineraires-custom`.
- **`assets/itineraire-builder.js`** — controller for `creer-itineraire.html`: renders the
  zone/lieu checkbox picker (one `<details>` per region in the same `REGION_ORDER` as
  `home-lieux.mjs`; checking a zone's checkbox bulk-checks/unchecks all its lieu checkboxes,
  which stay individually toggleable — that's the entire "zone alone = all its lieux, or
  affine lieu par lieu" behavior, no separate zone/lieu selection model needed — the zone
  checkbox is wrapped in a real `<label>`, not a `<span>`, so tapping the zone name toggles
  it too; a stray `<span>` wrapper here was a small-tap-target bug found in the same mobile
  audit), runs `generateItineraire` on click, and renders day columns with two ways to
  reorder: native HTML5 drag-and-drop (`draggable`, live DOM reorder on `dragover` via the
  standard "closest midpoint" pattern, re-synced into the in-memory `currentDays` state on
  `dragend` — no drag library, per the site's no-framework constraint) **and** ▲/▼ buttons
  on every stop card (`moveStop()`, swaps within a day or hands off to the previous/next
  day's start/end when moved past a day's boundary). The buttons aren't just a convenience:
  HTML5 drag-and-drop never fires from touch on iOS Safari and is inconsistent on Android
  Chrome, so on a phone — the primary device for planning on the go — they're the only way
  to reorder at all (added 2026-08-28 after a mobile audit caught this). `?id=<uuid>` in the
  URL loads a saved itinerary back in (pre-checks the picker, jumps straight to the results
  view, and "Sauvegarder" then updates that same entry instead of creating a new one).
- **`assets/itineraire-liste.js`** — controller for `mes-itineraires.html`: lists
  `listSaved()`, links each card to `creer-itineraire.html?id=…`, deletes on confirm.
- Rendering is intentionally lighter than `itin/*.html` — day list + map + per-stop
  Maps/Waze/Plans links, no transit-time blocks, sleep markers, or "à réserver" booking
  cards (those need data — realistic transit estimates, accommodation, which activité to
  feature — that isn't reliable to generate automatically yet; tracked in `ROADMAP.md`).

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
  (22/27, tracked in `ROADMAP.md` — the user wants to pick/supply these themselves, don't
  autonomously source photos for this; see `/add-activities`-adjacent note in memory). A
  lieu with real photography sets `heroSlides` (int) so `main.js`'s carousel picks up
  `hero.jpg`, `hero-2.jpg`, … from `assets/images/lieux/<slug>/`. An itinéraire hero can
  instead carry a literal `data-carousel-srcs` attribute listing multiple lieu hero images —
  stored verbatim as `heroImgTag` in `data/itineraires.json` rather than modeled as
  structured data. `assets/images/lieux/` folder names don't always match a *current* lieu
  slug: `villa-ephrussi-rothschild/` is real photography kept from when that was still its
  own lieu (see the demotion history above) — `sentier-cap-ferrat`'s `Villa Ephrussi de
  Rothschild` activité and the `menton-eze-monaco` itinéraire's hero carousel/booking card
  still reference it directly, so don't delete it even though no lieu owns that slug
  anymore. Demoted lieux that never had real photos get their folder deleted (only ever held
  the placeholder readme) — check for real files first if this comes up again.
- `<title>` tags use a bare `&`; everything else (h1, breadcrumbs, alt text) uses `&amp;` —
  the render templates already handle this split, don't "fix" one to match the other.
