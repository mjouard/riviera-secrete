"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DUREE_META, listSaved, deleteSaved, type SavedItineraire } from "@/lib/itineraire-logic";

export default function MesItinerairesPage() {
  const [items, setItems] = useState<SavedItineraire[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setItems(listSaved().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setLoaded(true);
  }, []);

  const handleDelete = (id: string, nom: string) => {
    if (!confirm(`Supprimer « ${nom} » ?`)) return;
    deleteSaved(id);
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  if (!loaded) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <nav className="text-sm mb-8 flex gap-2" style={{ color: "var(--text-muted)" }}>
        <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
        <span>/</span>
        <span style={{ color: "var(--text)" }}>Mes itinéraires</span>
      </nav>

      <div className="flex items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Mes itinéraires</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Sauvegardés localement sur cet appareil.
          </p>
        </div>
        <Link
          href="/creer-itineraire"
          className="text-sm px-4 py-2 rounded-xl font-semibold flex-shrink-0"
          style={{ background: "var(--terracotta)", color: "#0c1116" }}
        >
          + Créer
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "var(--surface)" }}>
          <p className="text-lg font-semibold mb-2">Aucun itinéraire sauvegardé</p>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Compose ton premier itinéraire sur mesure.
          </p>
          <Link
            href="/creer-itineraire"
            className="inline-block text-sm px-5 py-2.5 rounded-xl font-semibold"
            style={{ background: "var(--terracotta)", color: "#0c1116" }}
          >
            Créer un itinéraire →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => {
            const nbLieux = it.days.reduce((n, day) => n + day.length, 0);
            const dureeLabel = DUREE_META[it.dureeKey]?.label ?? it.dureeKey;
            const date = new Date(it.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric", month: "long", year: "numeric",
            });

            return (
              <div
                key={it.id}
                className="rounded-xl p-5 flex items-center justify-between gap-4"
                style={{ background: "var(--surface)" }}
              >
                <div className="min-w-0">
                  <h2 className="font-semibold mb-1 line-clamp-1">{it.nom}</h2>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>{dureeLabel}</span>
                    <span>📍 {nbLieux} lieu{nbLieux > 1 ? "x" : ""}</span>
                    <span>{date}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link
                    href={`/creer-itineraire?id=${encodeURIComponent(it.id)}`}
                    className="text-sm px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5"
                    style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
                  >
                    Voir
                  </Link>
                  <button
                    onClick={() => handleDelete(it.id, it.nom)}
                    className="text-sm px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5"
                    style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
