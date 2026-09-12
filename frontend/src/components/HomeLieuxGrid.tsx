"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Lieu } from "@/lib/types";
import { imgUrl } from "@/lib/utils";
import { BADGE_DEFS } from "@/lib/home-data";

function LieuCard({ lieu }: { lieu: Lieu }) {
  return (
    <Link
      href={`/lieux/${lieu.slug}`}
      className="card-reveal group block rounded-xl overflow-hidden transition-transform hover:-translate-y-1"
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
        <h3 className="font-semibold text-sm leading-snug mb-1">{lieu.nom}</h3>
        <p className="text-xs line-clamp-2" style={{ color: "var(--text-muted)" }}>
          {lieu.description}
        </p>
      </div>
    </Link>
  );
}

export default function HomeLieuxGrid({ lieux }: { lieux: Lieu[] }) {
  const [activeBadge, setActiveBadge] = useState<string>("");
  const gridRef = useRef<HTMLDivElement>(null);

  const filtered = activeBadge
    ? lieux.filter((l) => l.badges?.includes(activeBadge))
    : lieux;

  function toggle(badge: string) {
    setActiveBadge((prev) => (prev === badge ? "" : badge));
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
      <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Filtrer par activité">
        <button
          onClick={() => setActiveBadge("")}
          className="text-xs px-4 py-2 rounded-full border transition-colors"
          style={
            activeBadge === ""
              ? { background: "var(--terracotta)", color: "#0C1116", borderColor: "var(--terracotta)" }
              : { borderColor: "var(--line)", color: "var(--text-muted)" }
          }
        >
          Tous
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
            {b.emoji} {b.label}
          </button>
        ))}
      </div>
      <div className="flex items-baseline justify-between mb-8">
        <h2 className="text-2xl font-bold">Tous les lieux</h2>
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          {filtered.length} spot{filtered.length > 1 ? "s" : ""}
        </span>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Aucun lieu pour ce filtre.
        </p>
      ) : (
        <div ref={gridRef} className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((lieu) => (
            <LieuCard key={lieu.id} lieu={lieu} />
          ))}
        </div>
      )}
    </div>
  );
}
