"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import type { Lieu } from "@/lib/types";
import { distanceKm, formatDistanceKm, imgUrl, loc, normalizeSearch } from "@/lib/utils";
import { BADGE_DEFS } from "@/lib/home-data";
import {
  DUREES,
  NIVEAUX,
  SAISONS,
  dureeDuLieu,
  niveauxDuLieu,
  saisonsDuLieu,
  type Duree,
  type Niveau,
  type Saison,
} from "@/lib/lieu-filters";

/**
 * Sélecteur de filtre stylé.
 *
 * Un <select> natif reste le bon choix (le picker natif est bien plus agréable au pouce
 * qu'un menu maison, et l'accessibilité est gratuite), mais il faut neutraliser son
 * habillage par défaut, franchement laid en mobile :
 * - `appearance: none` + chevron dessiné nous-mêmes, sinon chaque OS impose sa flèche ;
 * - `colorScheme: dark` pour que la **liste déroulante native** s'affiche en sombre — sans
 *   ça, iOS et Android ouvrent un panneau blanc au milieu d'un site sombre ;
 * - hauteur fixe (h-10) alignée sur le bouton voisin, les hauteurs natives variant d'un OS
 *   à l'autre ;
 * - quand un filtre est actif, la pastille passe en terracotta comme les badges au-dessus :
 *   c'est le même langage visuel, et ça rend un filtre actif repérable d'un coup d'œil.
 */
function FilterSelect({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  const active = value !== "";
  return (
    <span className="relative inline-flex w-full sm:w-auto">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focus-ring w-full h-10 appearance-none rounded-full border pl-4 pr-9 text-xs font-medium cursor-pointer transition-colors sm:w-auto"
        style={{
          colorScheme: "dark",
          borderColor: active ? "var(--terracotta)" : "var(--line)",
          background: active ? "rgba(232,163,61,0.12)" : "var(--surface)",
          color: active ? "var(--terracotta)" : "var(--text-muted)",
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 12 12"
        className="pointer-events-none absolute right-3.5 top-1/2 h-3 w-3 -translate-y-1/2"
        style={{ color: active ? "var(--terracotta)" : "var(--text-muted)" }}
      >
        <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/**
 * Grille verticale à tous les viewports. C'était un carrousel horizontal en mobile :
 * 43 cartes sur 9 438 px de large, 1,8 carte visible à la fois, ~25 balayages pour en voir
 * le bout et aucun indicateur de position. Acceptable pour une rangée « À découvrir aussi »,
 * intenable pour le catalogue principal — celui que les filtres et la recherche juste
 * au-dessus servent justement à réduire. Deux colonnes en mobile : l'inventaire reste
 * parcourable au pouce sans doubler la longueur de page.
 */
const GRILLE_CLASSES = "grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4";

function LieuCard({
  lieu,
  distance,
  activiteTrouvee,
}: {
  lieu: Lieu;
  distance?: number;
  /** Nom de l'activité qui a fait remonter ce lieu, quand la recherche a matché dessus. */
  activiteTrouvee?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("home");
  return (
    <Link
      href={`/lieux/${lieu.slug}`}
      className="card-reveal group block rounded-xl overflow-hidden transition-transform hover:-translate-y-1"
      style={{ background: "var(--surface)" }}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={imgUrl(lieu.thumbImage)}
          alt={lieu.heroAlt}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
        {distance !== undefined && (
          <span
            className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: "rgba(12,17,22,0.78)", color: "var(--azure)" }}
          >
            {formatDistanceKm(distance)}
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs mb-1" style={{ color: "var(--azure)" }}>
          {lieu.commune}
        </p>
        <h3 className="font-semibold text-sm leading-snug mb-1">{loc(locale, lieu.nomEn, lieu.nom)}</h3>
        <p className="text-xs line-clamp-2" style={{ color: "var(--text-muted)" }}>
          {loc(locale, lieu.descriptionEn, lieu.description)}
        </p>
        {/* Sans cette ligne, chercher "kayak" renvoyait une carte "La Rue Obscure" sans
            aucun rapport visible avec la requête : on nomme l'activité qui a matché. */}
        {activiteTrouvee && (
          <p className="text-xs mt-2 line-clamp-1" style={{ color: "var(--terracotta)" }}>
            {t("resultatActivite", { activite: activiteTrouvee })}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function HomeLieuxGrid({ lieux }: { lieux: Lieu[] }) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("home");
  const tBadges = useTranslations("badges");
  const tFiltres = useTranslations("filtres");
  const [activeBadge, setActiveBadge] = useState<string>("");
  const [query, setQuery] = useState("");
  const [saison, setSaison] = useState<Saison | "">("");
  const [duree, setDuree] = useState<Duree | "">("");
  const [niveau, setNiveau] = useState<Niveau | "">("");
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [geoEtat, setGeoEtat] = useState<"idle" | "chargement" | "refuse" | "indisponible">("idle");
  const gridRef = useRef<HTMLDivElement>(null);

  // Index de recherche pré-calculé une fois par lieu (43 aujourd'hui) plutôt qu'à chaque
  // frappe : nom, commune, description, libellés de badges et **noms d'activités**, dans la
  // locale affichée — chercher "beach" sur /en doit marcher comme "plage" sur /fr. Accents
  // retirés des deux côtés pour que "eze" trouve "Èze".
  //
  // Les activités sont indexées en FR **et** en EN quelle que soit la locale : le placeholder
  // promet « une activité », et les deux graphies sont utiles des deux côtés (un anglophone
  // tape "snorkeling" là où la donnée EN dit "Snorkelling", mais la donnée FR dit bien
  // "Snorkeling").
  const searchIndex = useMemo(
    () =>
      lieux.map((l) => {
        const badgeLabels = (l.badges ?? []).map((slug) => {
          const known = ["plage", "randonnee", "vtt", "plongee", "restaurant"] as const;
          return (known as readonly string[]).includes(slug)
            ? tBadges(slug as (typeof known)[number])
            : slug;
        });
        const activites = (l.activites ?? []).map((a) => ({
          nom: loc(locale, a.nomEn, a.nom),
          haystack: normalizeSearch([a.nom, a.nomEn ?? ""].join(" ")),
        }));
        return {
          lieu: l,
          // Catégories dérivées ici plutôt qu'à chaque frappe : l'analyse du texte libre
          // des metaPills (voir lieu-filters.ts) est la partie coûteuse.
          saisons: saisonsDuLieu(l),
          duree: dureeDuLieu(l),
          niveaux: niveauxDuLieu(l),
          activites,
          haystack: normalizeSearch(
            [
              loc(locale, l.nomEn, l.nom),
              l.nom,
              l.commune,
              loc(locale, l.descriptionEn, l.description),
              ...(l.badges ?? []),
              ...badgeLabels,
            ].join(" ")
          ),
        };
      }),
    [lieux, locale, tBadges]
  );

  const filtered = useMemo(() => {
    const q = normalizeSearch(query);
    const retenus = searchIndex
      .filter((entry) => {
        if (activeBadge && !entry.lieu.badges?.includes(activeBadge)) return false;
        if (saison && !entry.saisons.includes(saison)) return false;
        if (duree && entry.duree !== duree) return false;
        if (niveau && !entry.niveaux.includes(niveau)) return false;
        if (q === "") return true;
        return entry.haystack.includes(q) || entry.activites.some((a) => a.haystack.includes(q));
      })
      .map(({ lieu, activites, haystack }) => ({
        lieu,
        distance: position ? distanceKm(position.lat, position.lng, lieu.lat, lieu.lng) : undefined,
        // Uniquement quand le lieu lui-même ne correspond pas : sur "eze", la carte "Èze,
        // le village perché" se passe d'explication, l'annotation ne servirait qu'à
        // brouiller le résultat.
        activiteTrouvee:
          q && !haystack.includes(q)
            ? activites.find((a) => a.haystack.includes(q))?.nom
            : undefined,
      }));

    // Le tri par distance ne s'applique que si une position est connue : sinon on conserve
    // l'ordre éditorial d'origine.
    if (position) retenus.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    return retenus;
  }, [searchIndex, activeBadge, query, saison, duree, niveau, position]);

  function toggle(badge: string) {
    setActiveBadge((prev) => (prev === badge ? "" : badge));
  }

  function resetAll() {
    setActiveBadge("");
    setQuery("");
    setSaison("");
    setDuree("");
    setNiveau("");
  }

  /**
   * Géolocalisation à la demande, jamais au chargement : demander la position sans que le
   * visiteur l'ait sollicitée est intrusif, et un refus initial est difficile à rattraper.
   * Un second clic désactive le tri sans redemander la permission.
   */
  function toggleProximite() {
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
  }

  /** Pioche parmi les résultats courants : « au hasard » doit respecter les filtres actifs. */
  function surprendsMoi() {
    if (filtered.length === 0) return;
    const pick = filtered[Math.floor(Math.random() * filtered.length)];
    router.push(`/lieux/${pick.lieu.slug}`);
  }

  // Apparition douce des cartes au scroll — même comportement que le site statique
  // (assets/main.js) : threshold 0.15, "one-shot" (unobserve dès la première apparition).
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || !("IntersectionObserver" in window)) return;
    const cards = grid.querySelectorAll(".card-reveal:not(.visible)");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [filtered]);

  return (
    <div>
      <div className="relative mb-4">
        <label htmlFor="lieu-search" className="sr-only">
          {t("rechercheLabel")}
        </label>
        <span
          className="absolute left-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
          aria-hidden="true"
        >
          🔎
        </span>
        <input
          id="lieu-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("recherchePlaceholder")}
          autoComplete="off"
          className="focus-ring w-full text-sm rounded-full border transition-colors py-2.5 pl-11 pr-11"
          style={{
            borderColor: "var(--line)",
            background: "var(--surface)",
            color: "var(--text)",
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label={t("rechercheEffacer")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-sm transition-colors hover:bg-white/10 cursor-pointer"
            style={{ color: "var(--text-muted)" }}
          >
            ✕
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label={t("filtrerParActivite")}>
        <button
          onClick={() => setActiveBadge("")}
          className="text-xs px-4 py-2 rounded-full border transition-colors"
          style={
            activeBadge === ""
              ? { background: "var(--terracotta)", color: "#0C1116", borderColor: "var(--terracotta)" }
              : { borderColor: "var(--line)", color: "var(--text-muted)" }
          }
        >
          {t("tous")}
        </button>
        {BADGE_DEFS.map((b) => (
          <button
            key={b.slug}
            onClick={() => toggle(b.slug)}
            className="text-xs px-4 py-2 rounded-full border transition-colors"
            style={
              activeBadge === b.slug
                ? { background: "var(--terracotta)", color: "#0C1116", borderColor: "var(--terracotta)" }
                : { borderColor: "var(--line)", color: "var(--text-muted)" }
            }
          >
            {b.emoji} {tBadges(b.slug as "plage" | "randonnee" | "vtt" | "plongee" | "restaurant")}
          </button>
        ))}
      </div>
      {/* Saison / durée / niveau : des <select> plutôt que des pastilles — 10 options de
          plus en pastilles noieraient les 5 badges au-dessus. Grille 2×2 en mobile (3
          sélecteurs + le bouton), rangée simple dès sm. */}
      <div className="grid grid-cols-2 gap-2 mb-8 sm:flex sm:flex-wrap sm:items-center">
        <FilterSelect
          label={tFiltres("saison")}
          value={saison}
          onChange={(v) => setSaison(v as Saison | "")}
          placeholder={tFiltres("saisonToutes")}
          options={SAISONS.map((s) => ({ value: s, label: tFiltres(s) }))}
        />
        <FilterSelect
          label={tFiltres("duree")}
          value={duree}
          onChange={(v) => setDuree(v as Duree | "")}
          placeholder={tFiltres("dureeToutes")}
          options={DUREES.map((d) => ({ value: d, label: tFiltres(d) }))}
        />
        <FilterSelect
          label={tFiltres("niveau")}
          value={niveau}
          onChange={(v) => setNiveau(v as Niveau | "")}
          placeholder={tFiltres("niveauTous")}
          options={NIVEAUX.map((n) => ({ value: n, label: tFiltres(n) }))}
        />

        <button
          type="button"
          onClick={toggleProximite}
          disabled={geoEtat === "chargement"}
          title={t("presDeMoiTitre")}
          aria-pressed={position !== null}
          className="h-10 px-4 rounded-full border text-xs font-medium transition-colors hover:bg-white/5 cursor-pointer disabled:opacity-60 disabled:cursor-default"
          style={
            position
              ? { borderColor: "var(--azure)", background: "rgba(79,195,201,0.12)", color: "var(--azure)" }
              : { borderColor: "var(--line)", color: "var(--text-muted)" }
          }
        >
          {geoEtat === "chargement"
            ? t("localisationEnCours")
            : position
              ? t("presDeMoiActif")
              : t("presDeMoi")}
        </button>

        <button
          type="button"
          onClick={surprendsMoi}
          disabled={filtered.length === 0}
          title={tFiltres("surprendsMoiTitre")}
          className="col-span-2 h-10 px-4 rounded-full border text-xs font-medium transition-colors hover:bg-white/5 cursor-pointer disabled:opacity-40 disabled:cursor-default sm:col-span-1"
          style={{ borderColor: "var(--terracotta)", color: "var(--terracotta)" }}
        >
          {tFiltres("surprendsMoi")}
        </button>
      </div>

      {(geoEtat === "refuse" || geoEtat === "indisponible") && (
        <p className="-mt-6 mb-8 text-xs" style={{ color: "var(--terracotta)" }}>
          {geoEtat === "refuse" ? t("localisationRefusee") : t("localisationIndisponible")}
        </p>
      )}

      <div className="flex items-baseline justify-between mb-8">
        <h2 className="text-2xl font-bold">{t("tousLesLieux")}</h2>
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          {filtered.length} {filtered.length > 1 ? t("spots") : t("spot")}
        </span>
      </div>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {query.trim() ? t("aucunResultat", { query: query.trim() }) : t("aucunLieuFiltre")}
          </p>
          <button
            type="button"
            onClick={resetAll}
            className="text-sm px-4 py-2 rounded-lg border transition-colors hover:bg-white/5 cursor-pointer"
            style={{ borderColor: "var(--line)", color: "var(--text)" }}
          >
            {t("reinitialiser")}
          </button>
        </div>
      ) : (
        <div ref={gridRef} className={GRILLE_CLASSES}>
          {filtered.map(({ lieu, distance, activiteTrouvee }) => (
            <LieuCard key={lieu.id} lieu={lieu} distance={distance} activiteTrouvee={activiteTrouvee} />
          ))}
        </div>
      )}
    </div>
  );
}
