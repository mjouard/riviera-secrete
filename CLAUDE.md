# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Riviera Secrète — a site listing 27 lesser-known spots ("lieux") on the French Riviera
(Menton → Saint-Tropez), grouped into 22 villes and 6 day-trip itineraries
("itinéraires"). French content throughout.

**Single stack**: `frontend/` (Next.js 16 App Router) + `backend/` (ASP.NET Core +
PostgreSQL API), started 2026-09-11 to unlock accounts/auth. This repo used to also
contain a from-scratch static HTML/CSS/JS site (root `index.html`, `lieux/*.html`,
`itin/*.html`, `villes/*.html`, `assets/`, `scripts/build.mjs`) generated straight from
`data/*.json` with no framework/server — that was the original build, deployed to
production first, and the Next.js/ASP.NET Core stack was a parallel rewrite for a while.
**The static site's code was removed 2026-09-12** once the Next.js app reached feature
parity with it (tracked to completion in `ROADMAP.md`'s "Portage site statique → Next.js"
section) — `data/*.json` is the one thing that survived the removal, since it's also the
backend's seed source (see below); everything that used to *generate HTML* from it
(`scripts/`, `assets/`, the root `*.html` files) is gone. If you see a reference anywhere
to `scripts/render/*.mjs`, `build.mjs`, or a root-level `.html` file, it's stale — that
code no longer exists in this repo, check git history if you need the old implementation
for reference.

The repo's own `.claude/memory/` (`project_overview.md`, `architecture_future.md`,
`frontend_nextjs.md`, `backend_dotnet.md`) has fuller, more current day-to-day detail on
this stack than this file — check those first, fix this section to match if they disagree.

## Commands

```bash
cd frontend && npm run dev          # Next.js dev server, http://localhost:3000
cd backend/RivieraSecrete.Api && dotnet run   # ASP.NET Core API, http://localhost:5171
```

There is no lint/test suite beyond `npx tsc --noEmit` and `npm run lint` in `frontend/`.
**Building/migrating the backend needs the .NET 10 SDK** (`TargetFramework net10.0`) — a
machine with only up to .NET 8 installed (check `dotnet --list-sdks`) needs it installed
first (e.g. `dotnet-install.sh --channel 10.0 --install-dir ~/.dotnet`, since writing to
the system-wide `/usr/local/share/dotnet` needs sudo); add `~/.dotnet` and
`~/.dotnet/tools` to `PATH` and set `DOTNET_ROOT`.

**Deploying**: frontend via `cd frontend && vercel --prod --yes` (see
`feedback_vercel_deploy.md` in `.claude/memory/` — must be run from `frontend/`, not the
repo root, or Vercel resolves to the wrong project); backend via `cd backend && railway up
--service api` (needs `railway link --project fearless-happiness --service api
--environment production` first on a machine that's never linked it). Both CLIs need an
interactive browser login the first time on a new machine (`vercel login` / `railway
login`, device-code flow) — cannot be done non-interactively.

## Data model: Région → Ville → Lieu → Activité

The object hierarchy is: **Région → Ville → Lieu → Activité**, plus **Itinéraire → Lieux**
as a separate cross-cutting grouping. A Lieu is a physical place (village, trail,
monument…) and owns its Activités; a Ville is the town/commune it sits in, and owns its
Lieux. This is real in the data, not just conceptual — and it's also the schema
`backend/RivieraSecrete.Domain/Entities/` mirrors field-for-field (`Ville` 1–N `Lieu` 1–N
`Activite`, `Itineraire` as a flatter standalone entity — see `.claude/memory/backend_dotnet.md`
for the full entity/endpoint reference):

- **`data/villes.json`** — source of truth for 22 villes (`slug`, `nom`,
  `regionSlug`/`regionLabel`, `lat`/`lng`, `description`, `thumbImage`, and `lieux: []` — a
  list of lieu slugs it owns, same by-reference pattern as everywhere else in this file). A
  lieu references its ville via `villeSlug`. **No validation catches an unresolved
  `villeSlug`** at seed time (`DatabaseSeeder.cs` reads the field directly, no throw-if-missing
  guard) — the old static-site build script used to hard-fail on this, that safety net is
  gone, so double-check a new lieu's `villeSlug` by hand against `data/villes.json`.
- **`data/lieux.json`** — source of truth for the 27 lieux, including `lat`/`lng`
  (WebSearch-verified against real-world coordinates, 2026-08-27 — 3 were found off by
  2–6km and corrected: `peille-village`, `peillon-village`,
  `roquebrune-cap-martin-village`; if you ever add a lieu, verify its coordinates the same
  way rather than eyeballing a map). Each lieu also owns an `activites[]` array (`id`,
  `nom`, `badge` (`gratuit`/`payant`), `duree`, `prix`, `url`, `image`, `alt`, `linkText`).
  Price/duration/url/image for a given activité exist **only here**. `metaPills` holds only
  the saison/durée/niveau pills — the 📍 coordinates pill is never stored, always computed
  from `lat`/`lng` at render time. **`ogImage` is dead data** (found 2026-09-12): every lieu
  has it hardcoded to `https://riviera-secrete.netlify.app/...`, a domain that predates even
  the Vercel migration and is now doubly dead since the static site was removed — but the
  Next.js frontend never reads this field at all (`lieux/[slug]/page.tsx` and
  `itineraires/[slug]/page.tsx` both compute their own `openGraph.images` from `heroImage` via
  `imgUrl()` instead). No user-visible impact, just stale data sitting in the JSON/DB column —
  safe to ignore until someone bothers to drop the field (JSON + `Lieu` entity + an EF
  migration), tracked in `ROADMAP.md`'s "Mise en production réelle" section.
- **`data/itineraires.json`** — the 6 itinéraires. Each `stop` item references a lieu by
  `lieuSlug`; its pills and the "à réserver" booking cards reference an activité by
  `{ lieuSlug, activiteId }` — never by copying its price/duration/url/image. Only a
  display-layer override lives on the itinéraire side (pill `label`, booking card
  `nomLabel`/`lieuLabel`, optional `extraSpans`/custom `linkText`). At render time
  (`frontend/src/app/itineraires/[slug]/page.tsx`) looks up the referenced activité in a
  `lieuBySlug` map (built from the already-fetched full lieux list) and pulls the real
  facts from there; the itinerary map's route points (lat/lng per stop) are likewise
  computed from the referenced lieu's coordinates at render time, never stored separately.

**These three JSON files are consumed two ways today**: `backend/RivieraSecrete.Infrastructure/Data/DatabaseSeeder.cs`
reads them to seed PostgreSQL (idempotent — checks `db.Villes.Any()` first, so re-running
it after the first seed is a no-op, **not a refresh**; there is no update path today — an
edit to `data/*.json` does **not** propagate to the backend DB automatically, only a fresh
empty database would pick it up). The frontend never reads these files directly — it talks
to the backend API, which serves whatever's in the DB.

A lieu's `related` cards (other lieux to discover) and an itinéraire's `suggestions` cards
(other itinéraires) are stored as raw extracted snapshots, **not** cross-referenced against
each other's live data — a known, intentionally-accepted duplication (lower stakes, lower
risk to fix).

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
None were really independent destinations. If a lieu ever needs demoting again: any stop
referencing it in `data/itineraires.json` has to be merged into the adjacent one (pills
moved over, transit/timing adjusted) rather than just repointed, and every raw
`suggestions[]`/`related[]` snapshot quoting the old lieu/itinéraire elsewhere needs the
same fix by hand (search for every copy — see "known duplication" above). Check the
current lieu count in `data/lieux.json` directly rather than trusting any number written in
this file.

**Badges vs activités.** A lieu also has `badges: string[]` — generic tags from a fixed
vocabulary (`plage`, `randonnee`, `vtt`, `plongee`, `restaurant`; the definitions live in
`frontend/src/lib/home-data.ts`'s `BADGE_DEFS`) declaring what's *practicable* at that
lieu, as opposed to `activites[]` which are unique, bookable things that exist at exactly
one lieu ("Le Jardin exotique" only exists at `eze-village`). All 27 lieux have at least one
badge (WebSearch-verified, 2026-08-27) — the one that had none (`chapelle-rosaire-vence`) is
the lieu that got demoted into `saint-paul-de-vence` above, which is itself a strong signal
worth reusing: a lieu with zero practicable badges is a candidate for demotion into an
activité of a nearby lieu, not a standalone destination. A badge means the activity is
practicable *at that specific lieu's location*, not just somewhere in the same commune:
`eze-village` is the perched village at ~400m, so it does **not** carry `plage` or
`plongee` even though the Èze commune has a beach and diving nearby — those are down at
Èze-sur-Mer, a different physical place. Same reasoning excluded `plage`/`plongee` from
`sentier-corbusier-cap-martin` (swimming signposted as prohibited along most of that specific
path) while `roquebrune-cap-martin-village` — a ~10min walk from the same beaches — keeps
`plage`. Don't add a badge from memory/assumption; verify it's actually practicable at that
lieu (WebSearch when uncertain) before adding or changing one.

## Architecture — Next.js 16 + ASP.NET Core

### `backend/` — ASP.NET Core API + PostgreSQL

Three-project .NET solution (`RivieraSecrete.slnx`): `RivieraSecrete.Domain` (POCO entities,
no EF references), `RivieraSecrete.Infrastructure` (EF Core `AppDbContext`, Npgsql, EF
migrations, `DatabaseSeeder`), `RivieraSecrete.Api` (minimal-API `Program.cs`, the only
project with HTTP/auth concerns). Deployed as a container (`backend/Dockerfile`, .NET 10 SDK
→ ASP.NET runtime, `EXPOSE 8080`) to Railway — the production API URL
(`https://api-production-19623.up.railway.app`) is what `frontend/.env.example` points
`NEXT_PUBLIC_API_URL` at.

- **Entities** (`RivieraSecrete.Domain/Entities/`): `Ville` 1–N `Lieu` 1–N `Activite`
  (mirrors `data/villes.json`/`lieux.json` exactly, down to field names — `Lieu.Badges`,
  `MetaPills`, `Tips`, `Related` are stored as EF-mapped JSON columns rather than join
  tables, since they're read-only editorial blobs with no relational query need);
  `Itineraire` is a flatter standalone entity (`Items`/`Booking`/`Suggestions` as JSON
  columns) — same "snapshot, not cross-referenced" shape `data/itineraires.json` has for its
  `related`/`suggestions` arrays. `User` owns `UserFavorite` (a user × lieu slug pair) and
  `UserItineraire` (`Days: string[][]` of lieu slugs, `DureeKey`). `User` supports two
  independent auth methods on the same row, addable in either order and mergeable: `GoogleId`
  (nullable — set for Google sign-in) and `PasswordHash`/`EmailConfirmed`/
  `EmailConfirmationToken`/`EmailConfirmationTokenExpiry` (nullable/default-false — set for
  email/password sign-up, added 2026-09-12). `Email` has a unique index across the whole
  table (not per-method), so `google-signin` links an incoming Google identity onto an
  existing password account with the same email instead of creating a duplicate row, and
  vice versa — see "Auth flow" below.
- **`DatabaseSeeder.SeedAsync`** reads `data/villes.json`/`lieux.json`/`itineraires.json`
  directly (relative path `../../data` from the Api project by default, overridable via
  `?dataDir=`) and bulk-inserts — **idempotent by checking `db.Villes.Any()` first**, so
  re-running it after the first seed is a no-op, not a refresh (see "Data model" above).
  Seeding is wired as a dev-only endpoint (`POST /api/seed`, gated behind
  `app.Environment.IsDevelopment()`), not a CLI command.
- **Auth flow — Google**: the frontend does Google sign-in via NextAuth (see below), then
  POSTs the Google ID token to `POST /api/auth/google-signin`; the backend verifies it
  against Google (`Google.Apis.Auth`'s `GoogleJsonWebSignature.ValidateAsync`, audience = the
  Google OAuth client id), finds/creates a `User` by `GoogleId` (falling back to a match by
  `Email` first, to link onto an existing password account rather than violate the unique
  email index), sets `EmailConfirmed = true` (Google already verified the address), and
  mints **its own** HS256 JWT (`Jwt:Secret`/`Issuer`/`Audience` config, 30-day expiry, `sub`
  claim = the `User.Id` guid) — the backend never trusts Google's token directly for later
  requests, only its own JWT, validated by the standard `AddJwtBearer` pipeline on every
  `.RequireAuthorization()` endpoint. `GetUserId(ClaimsPrincipal)` reads `sub` back out as
  the `User.Id`.
- **Auth flow — email/password** (added 2026-09-12): `POST /api/auth/register` (email,
  password ≥8 chars, nom) hashes the password with `BCrypt.Net-Next`, creates an unconfirmed
  `User` with a random 32-byte hex confirmation token (24h expiry), emails a confirmation
  link via `EmailService.cs` (plain HTTP POST to Resend's API — see below), and returns
  `{ status: "confirmation_required", email }` **without** a JWT — no session until
  confirmed. `POST /api/auth/login` checks the password hash then rejects with `403
  { error, code: "email_not_confirmed" }` if `EmailConfirmed` is still false (frontend shows
  a "resend" action on this specific code, distinct from a plain `401` wrong-password).
  `POST /api/auth/confirm-email` (token) flips `EmailConfirmed` and clears the token/expiry.
  `POST /api/auth/resend-confirmation` (email) re-issues a token and re-sends the email,
  always returning a generic `{status:"sent"}` regardless of whether the email exists.
  **`Resend:ApiKey`/`Resend:FromEmail`/`Frontend:Url` config** (Railway env vars
  `Resend__ApiKey` etc.) — `Resend:FromEmail` defaults to `onboarding@resend.dev`, Resend's
  sandbox sender, which **can only deliver to the Resend account's own verified email**
  until a domain is verified at resend.com/domains; real visitors won't receive confirmation
  emails until that happens (ties into `ROADMAP.md`'s pending "buy a domain" task) —
  `EmailService` logs and swallows send failures rather than throwing, so a Resend outage
  doesn't break registration, it just leaves the user without a delivered email (mitigated
  by the resend-confirmation endpoint once Resend is reachable again).
- **Endpoints**: public reads `GET /api/{lieux,villes,itineraires}` (+ `/{slug}` variants)
  and `GET /health`; auth `POST /api/auth/{google-signin,register,login,confirm-email,
  resend-confirmation}`; protected (`.RequireAuthorization()`) `GET/POST/DELETE
  /api/favorites` and full CRUD on `/api/my-itineraires`, all scoped to the caller's own
  `userId` via the JWT `sub` claim — no endpoint accepts a `userId` from the client.
- **Migrations**: `InitialCreate` (villes/lieux/activités/itinéraires schema), `AddUserTables`
  (users/favorites/itinéraires-custom), `AddPasswordAuth` (nullable `GoogleId`, add
  `PasswordHash`, unique index on `Email`), `AddEmailConfirmation` (`EmailConfirmed` +
  token/expiry, plus a data-fix `UPDATE` marking every pre-existing — necessarily
  Google-only — user as already confirmed) — run via standard `dotnet ef database update`,
  not automated on startup.
- CORS is locked to a single configured origin (`Cors:AllowedOrigin`, defaults to
  `http://localhost:3000` for local dev) — update it when the frontend's real deployed
  origin changes.
- **Piège critique — JWT `MapInboundClaims`**: by default, .NET JWT Bearer replaces `sub`
  with `ClaimTypes.NameIdentifier`, so `FindFirstValue(JwtRegisteredClaimNames.Sub)` returns
  `null` and every `.RequireAuthorization()` endpoint 401s even with a valid JWT. Fixed in
  `Program.cs` with `opts.MapInboundClaims = false;` — never remove this line, never use
  `ClaimTypes.NameIdentifier` instead of `JwtRegisteredClaimNames.Sub` in this project.

### `frontend/` — Next.js 16 (App Router) + Tailwind v4 + NextAuth v4

Routes under `frontend/src/app/`: `/`, `/lieux`, `/lieux/[slug]`, `/villes`,
`/villes/[slug]`, `/itineraires`, `/itineraires/[slug]`, `/creer-itineraire`,
`/mes-itineraires`, `/mes-favoris`, `/connexion`, `/confirmer-email`, `/credits`, plus
`/api/auth/[...nextauth]` (NextAuth's own route handler). `/mes-favoris` consumes the
backend's protected favorites API directly (`GET/DELETE /api/favorites` via `authFetch`) —
logged-out visitors are linked to `/connexion?callbackUrl=…`. Every account-related entry
point (`NavHeader`, `FavoriteButton`, `creer-itineraire`, `mes-itineraires`, `mes-favoris`)
links to `/connexion?callbackUrl=…` rather than calling `signIn("google")` directly, so the
visitor picks Google vs. email/password.

- **`/connexion`** — single page toggling between login/register (no separate routes),
  Google button + email/password form, show/hide password, inline errors. Register calls
  `POST /api/auth/register` directly (not via NextAuth) and, on success, shows a "check your
  inbox" screen instead of establishing a session (see the backend's email-confirmation
  flow above) — no auto-login post-signup. Login calls `POST /api/auth/login` directly
  *first* to read the precise error (`403 email_not_confirmed` → show a "resend" button;
  `401` → generic wrong-credentials message) before calling NextAuth's
  `signIn("credentials", …)` to actually establish the session — this two-step avoids
  NextAuth's `authorize()` collapsing every failure into one generic error.
- **`/confirmer-email`** — reads `?token=` from the URL (client-side, via
  `window.location.search`, not `useSearchParams`, to avoid a Suspense boundary), POSTs it
  to `/api/auth/confirm-email`, shows success (link to `/connexion`) or the specific backend
  error (e.g. expired token).
- **`/credits`** — static attribution page for the CC BY/CC BY-SA Wikimedia Commons photos
  used across the site (legally required by those licenses, not optional). Plain Server
  Component, `CREDITS` array hardcoded in the page itself. Linked from the shared footer
  (`layout.tsx`). When adding a new CC-licensed photo (see "Hero images" below), add its
  credit here too.

- **`src/lib/api.ts`** — typed fetch helpers against the backend: `api.{lieux,villes,
  itineraires}.{list,bySlug}()` for public server-side reads (Next.js `revalidate: 3600`,
  i.e. ISR — not fetched fresh per request), plus `authFetch(path, token, options)` for
  client-side calls that need the `Authorization: Bearer <token>` header.
  `NEXT_PUBLIC_API_URL` (env var, see `.env.example`) points at the backend; defaults to
  `http://localhost:5171` for local dev against `dotnet run`. `get<T>()` runs every response
  through `decodeDeep()`, which walks the parsed JSON recursively and decodes HTML entities
  (`&amp;` → `&`, etc.) on every string leaf via `decodeEntities()` in `src/lib/utils.ts` —
  needed because `data/*.json` contain literal `&amp;` from early content authoring, which
  React would otherwise double-escape and display verbatim as `&amp;` in JSX. Pure string
  logic, no DOM — safe in Server Components too. This decode is uniform across the whole
  app (titles, breadcrumbs, alt text, everywhere) — there's no split convention to remember.
- **`src/lib/auth.ts`** — NextAuth v4 config: `GoogleProvider` **and** `CredentialsProvider`
  side by side, `pages.signIn` pointed at `/connexion`. The `jwt` callback branches on which
  provider fired: Google does the `account.id_token` → `POST /api/auth/google-signin`
  exchange described above; the credentials path's `authorize()` instead calls
  `POST /api/auth/login` itself and returns `{ id, email, name, apiToken }` on success
  (`null` on any failure, per NextAuth convention), which the `jwt` callback picks up via
  the `user` argument. Either path ends up stashing `{ apiToken, apiUser }` onto the
  NextAuth JWT; the `session` callback then surfaces those as `session.apiToken` and
  `session.user.{id,name,email}` so client components never touch NextAuth's own token
  shape directly. `frontend/src/types/next-auth.d.ts` extends the library's
  `Session`/`JWT`/`User` types to add these fields.
- **`src/lib/itineraire-logic.ts`** — the itinerary-generation algorithm
  (`generateItineraire`, greedy day-by-day builder — see the function itself for the exact
  nearest-neighbor/time-budget logic). `DUREE_META` defines the duration presets
  (demi-journée/journée/2 jours/3 jours) and their per-day time budgets.
- **Leaflet maps**: `LeafletLieuMap`/`LeafletItinMap`/`HomeMap`/`BuilderMap` are the actual
  Leaflet components; `MapLieuWrapper`/`MapItinWrapper`/`HomeMapWrapper` exist to dynamically
  import them client-side-only (Leaflet touches `window` at module load, incompatible with
  Next's SSR) — always add new map usage through a wrapper, not the Leaflet component
  directly. All four **use OpenStreetMap standard tiles + a CSS dark-mode filter**
  (`src/lib/map-tiles.ts`'s `MAP_TILE_URL`/`MAP_TILE_ATTRIBUTION`/`applyDarkTileFilter()`) —
  they originally pointed at `basemaps.cartocdn.com/dark_all`, which CARTO has since locked
  behind a required API key (confirmed by fetching a tile directly: it returns a 200 OK PNG,
  but the image itself is a literal "API KEY REQUIRED — carto.com/basemaps/apikey"
  placeholder, not a map, so this silently "worked" per an HTTP-status check while rendering
  nothing real). `applyDarkTileFilter(map)` applies `invert(1) hue-rotate(180deg)
  brightness(0.95) contrast(0.9) saturate(0.3)` to the map's `tilePane` to approximate the
  site's dark theme on top of OSM's light tiles. When adding a `useEffect`-based Leaflet
  init (the pattern all of these follow: `import("leaflet").then(L => { ... })`), guard
  against React Strict Mode's double-invoke in dev with a `cancelled` flag checked at the
  top of the `.then()` callback and set in the effect's cleanup — `HomeMap.tsx` has this
  guard (added when the "Map container is already initialized" error surfaced there), but
  `LeafletLieuMap.tsx`/`LeafletItinMap.tsx` still don't, so the same latent bug likely exists
  on lieu/itinéraire pages too — apply the same fix there if it surfaces.
- **Homepage** (`src/app/page.tsx`) renders: a hero (`HomeHero.tsx` — ambient auto-crossfade
  of 8 images, 5s interval, no controls; distinct from `HeroCarousel.tsx` which is
  manual/click-driven and used on lieu/itinéraire pages), itinéraire cards (thumbnail from
  the first stop's lieu, via a `lieuBySlug` lookup built in `page.tsx`), `HomeActivities`
  (tabbed by category — outdoor/culture/gastronomie/loisirs — using a `FEATURED_ACTIVITIES`
  curation map in `src/lib/home-data.ts`), `HomeMapWrapper` (Leaflet map of the 22 villes,
  region-colored markers, click → info card, region filter buttons), `HomeLieuxGrid` (the
  27-lieu grid with 5 badge filters — `plage`/`randonnee`/`vtt`/`plongee`/`restaurant`,
  `BADGE_DEFS` in `home-data.ts` — plus a scroll-reveal effect on each card via
  `IntersectionObserver`, threshold 0.15, one-shot). A JSON-LD `ItemList` (one `ListItem`
  per ville) sits in a `<script type="application/ld+json">` in the page body — the only
  other JSON-LD block in the app is `TouristDestination` on `/villes/[slug]`; there is no
  `TouristAttraction` block on lieu pages currently.
- **Images** live in `frontend/public/assets/images/` — the only copy now (used to be
  duplicated from a static site's own `assets/images/`, no longer the case since that site
  was removed). A new lieu photo goes straight here, no second location to keep in sync.
- No `frontend/vercel.json` — relies on Vercel's Next.js framework auto-detection.

## Custom skills

- **`/add-activities`** — adds an activité to a lieu's `activites[]` in `data/lieux.json`.
- **`/build-itinerary`** — enriches an itinéraire in `data/itineraires.json` (pills, transit
  blocks, sleep markers, "à réserver" selection, geographic/timing coherence).

Both operate purely on the JSON data — there's no build step anymore, and no automatic path
from a JSON edit to the live backend DB (see "Data model" above; the skill files remind the
user of this after editing). See each command file under `.claude/commands/` for the full
ruleset (pill/label formatting conventions, day-rhythm philosophy for itineraries, etc.).

## Content conventions worth knowing

- Every lieu page carries a Leaflet mini-map (`MapLieuWrapper`); every itinéraire page
  carries a full Leaflet route map (`MapItinWrapper`) — both driven by lat/lng already
  present in `data/lieux.json`.
- Every lieu page also has a "Google Maps / Waze / Plans" link row (`buildMapLinks` in
  `frontend/src/lib/utils.ts`, right under the mini-map) built from the same `lat`/`lng` —
  no per-lieu URL is ever stored, all three are constructed from coordinates at render time.
  Itinéraire stops reuse the exact same `buildMapLinks`, one row per stop — **not** one
  combined multi-stop button for the whole trip: Google Maps supports a real multi-waypoint
  route via URL, but Waze and Apple Maps have no official multi-stop URL scheme (only
  "navigate to one point"), so a single "open the itinéraire" button couldn't honestly work
  the same way on all three. Per-stop links sidestep that; itinéraire pages additionally
  carry one button (`buildGoogleMapsRouteUrl` in `frontend/src/lib/utils.ts`, right under
  the meta-bar) that opens the *whole trip* as a Google Maps multi-stop route —
  origin/destination/waypoints built from the stop lieux in order, sleep markers skipped
  (they carry no coordinates of their own). Google Maps only; don't add a matching
  Waze/Plans button next to it — that's the whole reason the per-stop links exist instead.
- Hero images: all 27 lieux have real photography (finished 2026-08-28 — until then most
  used `picsum.photos` placeholders). The process that worked, worth repeating if a photo
  ever needs replacing or a new lieu is added: search Wikimedia Commons (a Wikipedia
  article's own infobox image is often already well-curated — check that first), view the
  actual candidate image before picking, not just its filename/license (composition/coherence
  matters — a technically-licensed but poorly-framed photo, like a blank wall or a blown-out
  sky, was rejected more than once in favor of a better shot of the same subject), crop with
  `sips -c height width --cropOffset y x` (off-center crop lets you cut a bad sky/foreground
  rather than just center-cropping) to the site's exact `hero.jpg` (1200×800, 3:2) and
  `thumb.jpg` (500×375, 4:3) dimensions, place them at
  `frontend/public/assets/images/lieux/<slug>/`, then add attribution to
  `frontend/src/app/credits/page.tsx`'s `CREDITS` array (CC BY-SA/CC BY both require it).
  Ask the user before autonomously sourcing photos — a past "carte blanche" grant for this
  was explicitly session-scoped, not a standing preference. A lieu with multiple real photos sets
  `heroSlides` (int) so `HeroCarousel` picks up `hero.jpg`, `hero-2.jpg`, … from that same
  folder. An itinéraire hero can instead carry a literal `data-carousel-srcs`-style list of
  multiple lieu hero images via `heroImgTag`/`parseHeroImgTag` in the itinéraire page.
  `frontend/public/assets/images/lieux/` folder names don't always match a *current* lieu
  slug: `villa-ephrussi-rothschild/` is real photography kept from when that was still its
  own lieu (see the demotion history above) — `sentier-cap-ferrat`'s `Villa Ephrussi de
  Rothschild` activité and the `menton-eze-monaco` itinéraire's hero carousel/booking card
  still reference it directly, so don't delete it even though no lieu owns that slug
  anymore.
