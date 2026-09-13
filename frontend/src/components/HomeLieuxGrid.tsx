"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import type { Lieu } from "@/lib/types";
import { imgUrl, loc, normalizeSearch } from "@/lib/utils";
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

function LieuCard({ lieu }: { lieu: Lieu }) {
  const locale = useLocale();
  return (
    <Link
      href={`/lieux/${lieu.slug}`}
      className="card-reveal group block rounded-xl overflow-hidden flex-shrink-0 snap-start w-[62%] sm:w-auto transition-transform hover:-translate-y-1"
      style={{ background: "var(--surface)" }}
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={imgUrl(lieu.thumbImage)}
          alt={lieu.heroAlt}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <p className="text-xs mb-1" style={{ color: "var(--azure)" }}>
          {lieu.commune}
        </p>
        <h3 className="font-semibold text-sm leading-snug mb-1">{loc(locale, lieu.nomEn, lieu.nom)}</h3>
        <p className="text-xs line-clamp-2" style={{ color: "var(--text-muted)" }}>
          {loc(locale, lieu.descriptionEn, lieu.description)}
        </p>
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
  const gridRef = useRef<HTMLDivElement>(null);

  // Index de recherche pré-calculé une fois par lieu (43 aujourd'hui) plutôt qu'à chaque
  // frappe : nom, commune, description et libellés de badges, dans la locale affichée —
  // chercher "beach" sur /en doit marcher comme "plage" sur /fr. Accents retirés des deux
  // côtés pour que "eze" trouve "Èze".
  const searchIndex = useMemo(
    () =>
      lieux.map((l) => {
        const badgeLabels = (l.badges ?? []).map((slug) => {
          const known = ["plage", "randonnee", "vtt", "plongee", "restaurant"] as const;
          return (known as readonly string[]).includes(slug)
            ? tBadges(slug as (typeof known)[number])
            : slug;
        });
        return {
          lieu: l,
          // Catégories dérivées ici plutôt qu'à chaque frappe : l'analyse du texte libre
          // des metaPills (voir lieu-filters.ts) est la partie coûteuse.
          saisons: saisonsDuLieu(l),
          duree: dureeDuLieu(l),
          niveaux: niveauxDuLieu(l),
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
    return searchIndex
      .filter((entry) => {
        if (activeBadge && !entry.lieu.badges?.includes(activeBadge)) return false;
        if (saison && !entry.saisons.includes(saison)) return false;
        if (duree && entry.duree !== duree) return false;
        if (niveau && !entry.niveaux.includes(niveau)) return false;
        return q === "" || entry.haystack.includes(q);
      })
      .map(({ lieu }) => lieu);
  }, [searchIndex, activeBadge, query, saison, duree, niveau]);

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

  /** Pioche parmi les résultats courants : « au hasard » doit respecter les filtres actifs. */
  function surprendsMoi() {
    if (filtered.length === 0) return;
    const pick = filtered[Math.floor(Math.random() * filtered.length)];
    router.push(`/lieux/${pick.slug}`);
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
          className="w-full text-sm rounded-full border outline-none transition-colors focus:border-white/30 py-2.5 pl-11 pr-11"
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
          plus en pastilles noieraient les 5 badges au-dessus. */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <select
          value={saison}
          onChange={(e) => setSaison(e.target.value as Saison | "")}
          aria-label={tFiltres("saison")}
          className="text-xs px-3 py-2 rounded-full border cursor-pointer outline-none focus:border-white/30 transition-colors"
          style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text-muted)" }}
        >
          <option value="">{tFiltres("saisonToutes")}</option>
          {SAISONS.map((s) => (
            <option key={s} value={s}>{tFiltres(s)}</option>
          ))}
        </select>

        <select
          value={duree}
          onChange={(e) => setDuree(e.target.value as Duree | "")}
          aria-label={tFiltres("duree")}
          className="text-xs px-3 py-2 rounded-full border cursor-pointer outline-none focus:border-white/30 transition-colors"
          style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text-muted)" }}
        >
          <option value="">{tFiltres("dureeToutes")}</option>
          {DUREES.map((d) => (
            <option key={d} value={d}>{tFiltres(d)}</option>
          ))}
        </select>

        <select
          value={niveau}
          onChange={(e) => setNiveau(e.target.value as Niveau | "")}
          aria-label={tFiltres("niveau")}
          className="text-xs px-3 py-2 rounded-full border cursor-pointer outline-none focus:border-white/30 transition-colors"
          style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text-muted)" }}
        >
          <option value="">{tFiltres("niveauTous")}</option>
          {NIVEAUX.map((n) => (
            <option key={n} value={n}>{tFiltres(n)}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={surprendsMoi}
          disabled={filtered.length === 0}
          title={tFiltres("surprendsMoiTitre")}
          className="text-xs px-4 py-2 rounded-full border transition-colors hover:bg-white/5 cursor-pointer disabled:opacity-40 disabled:cursor-default"
          style={{ borderColor: "var(--terracotta)", color: "var(--terracotta)" }}
        >
          {tFiltres("surprendsMoi")}
        </button>
      </div>

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
        <div
          ref={gridRef}
          className="hscroll flex gap-4 overflow-x-auto -mx-6 px-6 pb-2 snap-x snap-mandatory sm:grid sm:gap-6 sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        >
          {filtered.map((lieu) => (
            <LieuCard key={lieu.id} lieu={lieu} />
          ))}
        </div>
      )}
    </div>
  );
}
