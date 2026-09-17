# Audit frontend — 2026-09-17

Audit architectural complet : archi dossiers, composants, données, auth, i18n, maps, types,
CSS, performance, code smells. Priorités extraites dans `ROADMAP.md`.

**Verdict global : 7/10 — solide mais fragile par accumulation de patterns informels.**

---

## Forces identifiées

- **i18n** : routing `[locale]/`, fallbacks `loc()`, hreflang + canonical couplés dans `alternatesPage()` — impeccable
- **Server/Client split** : pages SSR correctes, dynamic imports Leaflet propres, `ssr: false` systématique
- **api.ts** : `decodeDeep`, tags ISR (`TAGS.lieux/villes/itineraires`), `authFetch`, séparation cache éditorial / no-store — cohérent
- **Maps Leaflet** : pattern wrapper + `cancelled` guard + dark tiles + touch cohérents sur les 4 cartes
- **CSS/design system** : tokens CSS (`--nuit`, `--aube`, `--mer-*`), classes `.btn*`, `.focus-ring` bien définis
- **Types** : centralisés dans `src/lib/types.ts`, aucun `any`, aucun `TODO/FIXME`

---

## ⚠️ Critiques

### 1. `FormulaireAuth.tsx` — composant God (~350 lignes, 3 logiques mélangées)

**Problème** : Login + Register + PendingConfirmation dans un seul composant. 8 états simultanés
(`email`, `password`, `showPassword`, `loading`, `error`, `needsConfirmation`, `pendingEmail`,
`resendStatus`). Logique API métier mélangée au rendu (lignes 82-141 : POST `/register`, `/login`,
redirections).

**Impact** : toute évolution du flow auth (MFA, magic link, autre provider) est bloquée. Moindre
changement casse l'autre chemin.

**Fix** : scinder en 3 composants indépendants :
```tsx
// Remplace <FormulaireAuth> par :
<LoginForm />
<RegisterForm />
<PendingConfirmationForm />
```

### 2. Typage NextAuth Session/JWT insuffisant (`src/types/next-auth.d.ts`)

**Problème** :
```tsx
interface Session {
  apiToken?: string;  // optionnel, mais tout authFetch l'assume présent
  user: { id?: string; ... };  // idem
}
```
`apiToken` déclaré optionnel alors que `carnet/page.tsx` l.54 l'assume toujours présent.
Pas de refresh token → session expirée = requête silencieusement échouée côté client.

**Fix** :
```tsx
interface Session {
  apiToken: string;   // obligatoire dès que connecté
  user: { id: string; name: string; email: string };
}
```
Ajouter un interceptor dans `authFetch` qui détecte 401 et force `signOut()`.

### 3. `carnet/page.tsx` — 3 états de chargement disjoints

**Problème** : `favLoading`, `itinLoaded`, `loadingAuth` chargés dans 2 `useEffect` séparés.
Risque de flash d'UI intermédiaire ; logique suppression inline (lignes 83-93).

**Fix** : hook `useCarnetData()` avec `Promise.all` et un seul état de chargement.

---

## 🔶 Majeurs

### 4. `estTactile()` dupliquée

- `map-tiles.ts` l.32-35 : `estTactile()` — version de référence
- `ExplorerMap.tsx` l.16-18 : `tactile()` — redéfinition identique

**Fix** : exporter uniquement depuis `map-tiles.ts`, supprimer la copie locale.

### 5. Couleurs Leaflet hardcodées

- `BuilderMap.tsx` l.23 : `"#E8A33D"` (le token `--aube`)
- `LeafletItinMap.tsx` l.28 : `"#4a9eca"` (jamais défini dans le design system)

**Fix** : centraliser dans une fonction `getMarkerColor(key: string)` lisant les tokens CSS.

### 6. `ItineraireItem` — union sans discriminant (`src/lib/types.ts`)

**Problème** : `type: "stop" | "transit" | "sleep"` sans discriminated union. Champs orthogonaux
(`nom?`, `lieuSlug?`, `activites?`, `dormirA?`) tous optionnels, le compilateur n'aide pas.

**Fix** :
```tsx
type ItineraireItem =
  | { type: "stop"; lieuSlug: string; nom: string; activites: StopActivite[] }
  | { type: "transit"; duree: string; description: string }
  | { type: "sleep"; dormirA: string }
```

### 7. Champs nullable incohérents (`src/lib/types.ts`)

**Problème** : `nomEn?: string | null` — double nullité (`undefined` ET `null`). L'appelant doit
gérer les deux cas partout.

**Fix** : choisir un modèle unique :
- `nomEn?: string` — optionnel (absent = non traduit)
- `nomEn: string | null` — présent mais nullable

### 8. `itineraire-logic.ts` — ~350 lignes monolithique

Mélange génération (`generateItineraire`), planning (`construirePlanning`), formatage
(`parseDureeTexte`, DUREE_META). Difficile à tester unitairement.

**Fix** : scinder en `generateItineraire.ts` / `planningUtils.ts` / `dureeUtils.ts`.

### 9. Props drilling Explorer — 4 niveaux

`ExplorerShell → ExplorerList → ExplorerListCard` : `onHover`, `hoveredSlug`, filtres passés
en cascade sur 4 niveaux.

**Fix** : `FilterContext` + `useFilter()` hook.

### 10. Gestion d'erreurs incohérente

- Erreurs API traduits via `codeErreur()` + `useTranslations("erreursApi")` ✓
- Mais `.catch(() => {})` muet dans plusieurs pages (Carnet l.60, l.68…)
- Aucun `ErrorBoundary` visible dans l'app

**Fix** : `ErrorBoundary` wrapper global + toast system pour les network failures silencieux.

---

## 💡 Mineurs

### 11. Aucun test sur la logique métier

`generateItineraire()`, `construirePlanning()`, `parseDureeTexte()` — code complexe, zéro couverture.
Risque fort à la moindre refacto.

**Fix** : Jest/Vitest sur `itineraire-logic.ts` en priorité (logique pure, pas de DOM).

### 12. Sync hover carte ↔ liste non mutualisée

`ExplorerMap.tsx` l.140 : `onHoverMarker` callback. Chaque composant gère son propre `hoveredSlug`.
Pas un bug, mais duplication si le pattern se répète.

**Fix** : voir item 9 (`FilterContext`).

### 13. ResizeObserver + MarkerCluster (`ExplorerMap.tsx` l.172-196)

Logique `tailleDejaConnue` complexe. Si mobile bascule liste/carte **et** filtre change durant,
risque de race condition non documenté.

**À surveiller** : tester switch + filter simultanés en conditions mobiles réelles.

### 14. 5 fonts Google en layout.tsx (lignes 2-42)

Inter, Fraunces, Bodoni Moda, Karla, IBM Plex Mono. Impact FCP/LCP non mesuré.

**Fix** : audit Lighthouse, supprimer ou subsetter les fonts peu utilisées.

### 15. Pas de bundle analysis

112 fichiers source sans `next/bundle-analyzer`. Impossible de mesurer la taille des chunks.

**Fix** : `npm install --save-dev @next/bundle-analyzer`, script d'analyse dans `package.json`.

---

## Récapitulatif priorisé

| # | Fichier | Problème | Sévérité |
|---|---------|----------|----------|
| 1 | `FormulaireAuth.tsx` | Composant God, 3 logiques | ⚠️ Critique |
| 2 | `types/next-auth.d.ts` | Session/JWT mal typée | ⚠️ Critique |
| 3 | `carnet/page.tsx` | 3 états de chargement disjoints | ⚠️ Critique |
| 4 | `ExplorerMap.tsx` l.16 | `estTactile()` dupliquée | 🔶 Majeur |
| 5 | `BuilderMap.tsx` l.23, `LeafletItinMap.tsx` l.28 | Couleurs hardcodées | 🔶 Majeur |
| 6 | `types.ts` — `ItineraireItem` | Union sans discriminant | 🔶 Majeur |
| 7 | `types.ts` — champs nullable | `?: string \| null` incohérent | 🔶 Majeur |
| 8 | `itineraire-logic.ts` | 350 lignes, 3 domaines mélangés | 🔶 Majeur |
| 9 | `ExplorerShell/List/Card` | Props drilling 4 niveaux | 🔶 Majeur |
| 10 | Plusieurs pages | `.catch(() => {})` muet | 🔶 Majeur |
| 11 | `itineraire-logic.ts` | Aucun test | 💡 Mineur |
| 12 | `ExplorerMap.tsx` | Hover sync non mutualisé | 💡 Mineur |
| 13 | `ExplorerMap.tsx` l.172 | Race condition ResizeObserver | 💡 Mineur |
| 14 | `layout.tsx` | 5 fonts, FCP non mesuré | 💡 Mineur |
| 15 | — | Pas de bundle analysis | 💡 Mineur |
