"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { Lieu } from "@/lib/types";
import { distanceKm, loc, normalizeSearch } from "@/lib/utils";
import { BADGE_DEFS } from "@/lib/home-data";
import {
  DUREES,
  NIVEAUX,
  SAISONS,
  TAGS_LIEU,
  dureeDuLieu,
  niveauxDuLieu,
  saisonsDuLieu,
} from "@/lib/lieu-filters";
import { ecrireFiltres, lireParam, lireTexte, useSearchString } from "@/lib/url-filtres";
import { IconMap, IconClose } from "@/components/ui/Icons";
import ExplorerFilterBar from "./ExplorerFilterBar";
import ExplorerList from "./ExplorerList";
import ExplorerMapWrapper from "@/components/explorer/ExplorerMapWrapper";
import { ExplorerHoverProvider } from "@/components/explorer/ExplorerHoverContext";

const PAR_PAGE = 24;
const REGION_SLUGS = ["menton-monaco", "nice", "arriere-pays", "antibes-cannes", "golfe-st-tropez"] as const;
const BADGE_SLUGS = BADGE_DEFS.map((b) => b.slug);

export type FiltresExplorer = { zone: string; badge: string; type: string; saison: string; duree: string; niveau: string; q: string };

export default function ExplorerShell({ lieux }: { lieux: Lieu[] }) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("explorer");
  const tBadges = useTranslations("badges");

  const search = useSearchString();
  const filtres: FiltresExplorer = useMemo(
    () => ({
      zone: lireParam(search, "zone", REGION_SLUGS),
      badge: lireParam(search, "badge", BADGE_SLUGS),
      type: lireParam(search, "type", TAGS_LIEU),
      saison: lireParam(search, "saison", SAISONS),
      duree: lireParam(search, "duree", DUREES),
      niveau: lireParam(search, "niveau", NIVEAUX),
      q: lireTexte(search, "q"),
    }),
    [search]
  );

  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  /** Carte plein écran sur mobile (→ audit UX 17/09, 3.2) — remplace l'ancien aller-retour
   * liste/carte : la liste reste maintenant toujours visible et défile avec la page, la carte
   * s'ouvre par-dessus via le bouton flottant plutôt que de remplacer la liste sur place. */
  const [carteOuverte, setCarteOuverte] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAR_PAGE);

  // Bloque le défilement de la page derrière la carte plein écran, et permet de la fermer
  // au clavier (Échap) — même attente qu'une modale ailleurs sur le site.
  useEffect(() => {
    if (!carteOuverte) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCarteOuverte(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [carteOuverte]);

  // « Près de moi » / « Surprends-moi » — portés depuis l'ancienne HomeLieuxGrid.tsx (accueil,
  // Lot 4e) : bien reçus par un audit externe, absents du spec de refonte mais pas question de
  // les perdre en remplaçant la grille de l'accueil par cet aperçu. Position en état local, pas
  // dans l'URL — c'est une permission de session, pas un filtre qu'on partage dans un lien.
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [geoEtat, setGeoEtat] = useState<"idle" | "chargement" | "refuse" | "indisponible">("idle");

  const majFiltres = useCallback((patch: Partial<FiltresExplorer>) => {
    const courant = window.location.search;
    ecrireFiltres({
      zone: lireParam(courant, "zone", REGION_SLUGS),
      badge: lireParam(courant, "badge", BADGE_SLUGS),
      type: lireParam(courant, "type", TAGS_LIEU),
      saison: lireParam(courant, "saison", SAISONS),
      duree: lireParam(courant, "duree", DUREES),
      niveau: lireParam(courant, "niveau", NIVEAUX),
      q: lireTexte(courant, "q"),
      ...patch,
    });
    setVisibleCount(PAR_PAGE);
  }, []);

  // Même index dérivé (saisons/durée/niveau, texte de recherche normalisé) que HomeLieuxGrid —
  // le calcul coûteux (analyse des metaPills en texte libre) une fois par lieu, pas par frappe.
  const index = useMemo(
    () =>
      lieux.map((l) => {
        const badgeLabels = (l.badges ?? []).map((slug) => {
          const known = BADGE_SLUGS as readonly string[];
          return known.includes(slug) ? tBadges(slug as "plage" | "randonnee" | "vtt" | "plongee" | "restaurant") : slug;
        });
        return {
          lieu: l,
          saisons: saisonsDuLieu(l),
          duree: dureeDuLieu(l),
          niveaux: niveauxDuLieu(l),
          haystack: normalizeSearch(
            [loc(locale, l.nomEn, l.nom), l.nom, l.commune, ...(l.badges ?? []), ...badgeLabels].join(" ")
          ),
        };
      }),
    [lieux, locale, tBadges]
  );

  const filtered = useMemo(() => {
    const q = normalizeSearch(filtres.q);
    const retenus = index.filter((entry) => {
      if (filtres.zone && entry.lieu.regionSlug !== filtres.zone) return false;
      if (filtres.badge && !entry.lieu.badges?.includes(filtres.badge)) return false;
      if (filtres.type && !entry.lieu.tags?.includes(filtres.type)) return false;
      if (filtres.saison && !entry.saisons.includes(filtres.saison as (typeof SAISONS)[number])) return false;
      if (filtres.duree && entry.duree !== filtres.duree) return false;
      if (filtres.niveau && !entry.niveaux.includes(filtres.niveau as (typeof NIVEAUX)[number])) return false;
      if (q === "") return true;
      return entry.haystack.includes(q);
    });
    // Le tri par distance ne s'applique que si une position est connue : sinon on conserve
    // l'ordre éditorial d'origine (même logique que l'ancienne HomeLieuxGrid).
    if (position) {
      retenus.sort(
        (a, b) =>
          distanceKm(position.lat, position.lng, a.lieu.lat, a.lieu.lng) -
          distanceKm(position.lat, position.lng, b.lieu.lat, b.lieu.lng)
      );
    }
    return retenus.map((entry) => entry.lieu);
  }, [index, filtres, position]);

  const distanceBySlug = useMemo(() => {
    if (!position) return undefined;
    return new Map(filtered.map((l) => [l.slug, distanceKm(position.lat, position.lng, l.lat, l.lng)]));
  }, [position, filtered]);

  const visibles = filtered.slice(0, visibleCount);

  /** Géolocalisation à la demande, jamais au chargement — un second clic désactive le tri
   * sans redemander la permission. */
  const toggleProximite = useCallback(() => {
    if (position) {
      setPosition(null);
      setGeoEtat("idle");
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoEtat("indisponible");
      return;
    }
    setGeoEtat("chargement");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoEtat("idle");
      },
      (err) => setGeoEtat(err.code === err.PERMISSION_DENIED ? "refuse" : "indisponible"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  }, [position]);

  /** Pioche parmi les résultats courants : « au hasard » doit respecter les filtres actifs. */
  const surprendsMoi = useCallback(() => {
    if (filtered.length === 0) return;
    const pick = filtered[Math.floor(Math.random() * filtered.length)];
    router.push(`/lieux/${pick.slug}`);
  }, [filtered, router]);

  return (
    <div>
      <ExplorerFilterBar
        filtres={filtres}
        onChange={majFiltres}
        position={position}
        geoEtat={geoEtat}
        onToggleProximite={toggleProximite}
        onSurprendsMoi={surprendsMoi}
        surprendsMoiDesactive={filtered.length === 0}
      />

      <p className="text-meta mb-4" style={{ color: "var(--brume)" }}>
        {t("resultats", { count: filtered.length, total: lieux.length })}
      </p>

      <ExplorerHoverProvider value={{ hoveredSlug, onHover: setHoveredSlug }}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_468px] gap-6">
          {/* Carte — colonne fixe à droite ≥1024px (inchangé) ; sur mobile, plein écran par-
              dessus le reste (fixed inset-0) uniquement quand ouverte via le bouton flottant,
              sinon absente du flux (→ audit UX 17/09, 3.2). `lg:static` neutralise le
              positionnement fixe dès 1024px, quel que soit l'état `carteOuverte`. */}
          <div
            className={carteOuverte ? "fixed inset-0 z-50 lg:static lg:z-auto lg:block" : "hidden lg:block"}
            style={{ height: carteOuverte ? "100dvh" : "min(80vh, 720px)" }}
          >
            {carteOuverte && (
              <button
                type="button"
                onClick={() => setCarteOuverte(false)}
                aria-label={t("fermerCarte")}
                className="focus-ring-aube lg:hidden absolute top-3 right-3 w-11 h-11 flex items-center justify-center rounded-full"
                style={{ background: "var(--nuit-haute)", color: "var(--calcaire)", boxShadow: "var(--shadow-float)", zIndex: 1000 }}
              >
                <IconClose className="w-5 h-5" />
              </button>
            )}
            <ExplorerMapWrapper lieux={filtered} hoveredSlug={hoveredSlug} onHoverMarker={setHoveredSlug} />
          </div>

          {/* Liste — toujours visible et défile avec la page sur mobile (plus de bascule
              liste/carte qui la masquait entièrement). */}
          <div>
            <ExplorerList
              lieux={visibles}
              total={filtered.length}
              onVoirPlus={() => setVisibleCount((c) => c + PAR_PAGE)}
              onToutEffacer={() => majFiltres({ zone: "", badge: "", type: "", saison: "", duree: "", niveau: "", q: "" })}
              distanceBySlug={distanceBySlug}
            />
          </div>
        </div>
      </ExplorerHoverProvider>

      {!carteOuverte && (
        <button
          type="button"
          onClick={() => setCarteOuverte(true)}
          className="focus-ring-aube lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 inline-flex items-center gap-2 h-11 px-5 rounded-full font-semibold text-body"
          style={{ background: "var(--nuit-haute)", color: "var(--calcaire)", boxShadow: "var(--shadow-float)", border: "1px solid var(--line)" }}
        >
          <IconMap className="w-4 h-4" />
          {t("carte")}
        </button>
      )}
    </div>
  );
}
