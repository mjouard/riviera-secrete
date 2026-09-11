"use client";
import { useState } from "react";
import Link from "next/link";
import type { Lieu } from "@/lib/types";
import { imgUrl } from "@/lib/utils";
import { ACTIVITY_CATEGORIES, FEATURED_ACTIVITIES } from "@/lib/home-data";

interface CardData {
  key: string;
  nom: string;
  badge: "gratuit" | "payant";
  duree: string;
  prix: string;
  image: string;
  commune: string;
  lieuSlug: string;
}

export default function HomeActivities({ lieux }: { lieux: Lieu[] }) {
  const [active, setActive] = useState<string>(ACTIVITY_CATEGORIES[0].slug);

  const byCategory: Record<string, CardData[]> = {};
  ACTIVITY_CATEGORIES.forEach((c) => (byCategory[c.slug] = []));
  lieux.forEach((lieu) => {
    (lieu.activites ?? []).forEach((act) => {
      const cat = FEATURED_ACTIVITIES[act.activiteId];
      if (!cat || !byCategory[cat]) return;
      byCategory[cat].push({
        key: `${lieu.slug}-${act.activiteId}`,
        nom: act.nom,
        badge: act.badge,
        duree: act.duree,
        prix: act.prix,
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
        aria-label="Catégories d'activités"
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
            {cat.label}
          </button>
        ))}
      </div>
      {ACTIVITY_CATEGORIES.map((cat) => (
        <div
          key={cat.slug}
          role="tabpanel"
          hidden={active !== cat.slug}
          className="flex gap-4 overflow-x-auto pb-2"
        >
          {byCategory[cat.slug].length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Rien pour l&apos;instant dans cette catégorie.
            </p>
          ) : (
            byCategory[cat.slug].map((card) => (
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
                    {card.badge === "gratuit" ? "Gratuit" : "Payant"}
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium leading-snug mb-1">{card.nom}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    📍 {card.commune}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    ⏱ {card.duree}
                    {card.badge === "payant" ? ` · ${card.prix}` : ""}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      ))}
    </div>
  );
}
