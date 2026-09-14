"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Lieu } from "@/lib/types";
import { imgUrl, loc, prixAffiche } from "@/lib/utils";
import { ACTIVITY_CATEGORIES, FEATURED_ACTIVITIES } from "@/lib/home-data";

interface CardData {
  key: string;
  nom: string;
  badge: "gratuit" | "payant";
  duree: string;
  dureeEn?: string | null;
  prix: string;
  prixEn?: string | null;
  image: string;
  commune: string;
  lieuSlug: string;
}

export default function HomeActivities({ lieux }: { lieux: Lieu[] }) {
  const locale = useLocale();
  const t = useTranslations("home");
  const tCategories = useTranslations("categories");
  const tActivite = useTranslations("activite");
  const [active, setActive] = useState<string>(ACTIVITY_CATEGORIES[0].slug);
  // Filtre "gratuit" placé ici et non sur la grille des lieux : 42 lieux sur 43 ont au
  // moins une activité gratuite et aucun n'est entièrement gratuit, donc au niveau du lieu
  // le filtre ne discriminerait rien. Au niveau des activités il sépare réellement
  // (12 gratuites / 24 payantes dans la sélection mise en avant).
  const [gratuitSeulement, setGratuitSeulement] = useState(false);

  const byCategory: Record<string, CardData[]> = {};
  ACTIVITY_CATEGORIES.forEach((c) => (byCategory[c.slug] = []));
  lieux.forEach((lieu) => {
    (lieu.activites ?? []).forEach((act) => {
      const cat = FEATURED_ACTIVITIES[act.activiteId];
      if (!cat || !byCategory[cat]) return;
      byCategory[cat].push({
        key: `${lieu.slug}-${act.activiteId}`,
        nom: loc(locale, act.nomEn, act.nom),
        badge: act.badge,
        duree: act.duree,
        dureeEn: act.dureeEn,
        prix: act.prix,
        prixEn: act.prixEn,
        image: act.image,
        commune: lieu.commune,
        lieuSlug: lieu.slug,
      });
    });
  });

  return (
    <div>
      <div
        className="flex gap-2 flex-wrap mb-6"
        role="tablist"
        aria-label={t("categoriesActivites")}
      >
        {ACTIVITY_CATEGORIES.map((cat) => (
          <button
            key={cat.slug}
            role="tab"
            aria-selected={active === cat.slug}
            onClick={() => setActive(cat.slug)}
            className="text-xs px-4 py-2 rounded-full border transition-colors"
            style={
              active === cat.slug
                ? { background: "var(--terracotta)", color: "#0C1116", borderColor: "var(--terracotta)" }
                : { borderColor: "var(--line)", color: "var(--text-muted)" }
            }
          >
            {tCategories(cat.slug as "outdoor" | "culture" | "gastronomie" | "loisirs")}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setGratuitSeulement((v) => !v)}
          aria-pressed={gratuitSeulement}
          className="text-xs px-4 py-2 rounded-full border transition-colors cursor-pointer"
          style={
            gratuitSeulement
              ? { background: "var(--azure)", color: "#0C1116", borderColor: "var(--azure)" }
              : { borderColor: "var(--line)", color: "var(--text-muted)" }
          }
        >
          {t("gratuitSeulement")}
        </button>
      </div>
      {ACTIVITY_CATEGORIES.map((cat) => {
        const cards = gratuitSeulement
          ? byCategory[cat.slug].filter((c) => c.badge === "gratuit")
          : byCategory[cat.slug];
        return (
        <div
          key={cat.slug}
          role="tabpanel"
          hidden={active !== cat.slug}
          className="flex gap-4 overflow-x-auto pb-2"
        >
          {cards.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {gratuitSeulement ? t("aucuneGratuite") : t("rienPourInstant")}
            </p>
          ) : (
            cards.map((card) => (
              <Link
                key={card.key}
                href={`/lieux/${card.lieuSlug}`}
                className="flex-shrink-0 w-56 rounded-xl overflow-hidden transition-transform hover:-translate-y-1"
                style={{ background: "var(--surface)" }}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={imgUrl(card.image)}
                    alt={card.nom}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <span
                    className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={
                      card.badge === "gratuit"
                        ? { background: "var(--azure)", color: "#0C1116" }
                        : { background: "rgba(12,17,22,0.75)", color: "#fff" }
                    }
                  >
                    {card.badge === "gratuit" ? tActivite("Gratuit") : tActivite("Payant")}
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium leading-snug mb-1">{card.nom}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    📍 {card.commune}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    ⏱ {loc(locale, card.dureeEn, card.duree)}
                    {card.badge === "payant" ? ` · ${prixAffiche(locale, card.prixEn, card.prix)}` : ""}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
        );
      })}
    </div>
  );
}
