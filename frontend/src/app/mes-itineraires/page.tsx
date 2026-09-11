"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { DUREE_META, listSaved, deleteSaved, type SavedItineraire } from "@/lib/itineraire-logic";
import { authFetch } from "@/lib/api";

interface DbItineraire {
  id: string;
  nom: string;
  dureeKey: string;
  days: string[][];
  createdAt: string;
}

interface DisplayItem {
  id: string;
  nom: string;
  dureeKey: string;
  days: string[][];
  createdAt: string;
  source: "local" | "db";
}

export default function MesItinerairesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [items, setItems] = useState<DisplayItem[]>([]);
  const [localOrphans, setLocalOrphans] = useState<SavedItineraire[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    if (session?.apiToken) {
      const [res] = await Promise.all([
        authFetch("/api/my-itineraires", session.apiToken).then((r) =>
          r.ok ? (r.json() as Promise<DbItineraire[]>) : []
        ),
      ]);
      const dbItems: DisplayItem[] = (res as DbItineraire[]).map((it) => ({
        ...it,
        source: "db",
      }));
      setItems(dbItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

      // Itinéraires locaux non encore importés
      const local = listSaved();
      setLocalOrphans(local);
    } else if (status !== "loading") {
      const local = listSaved().sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setItems(local.map((it) => ({ ...it, source: "local" })));
    }
    setLoaded(true);
  }, [session, status]);

  useEffect(() => {
    if (status !== "loading") loadItems();
  }, [loadItems, status]);

  async function handleDelete(id: string, nom: string, source: "local" | "db") {
    if (!confirm(`Supprimer « ${nom} » ?`)) return;
    setDeleting(id);
    try {
      if (source === "db" && session?.apiToken) {
        await authFetch(`/api/my-itineraires/${id}`, session.apiToken, { method: "DELETE" });
      } else {
        deleteSaved(id);
      }
      setItems((prev) => prev.filter((it) => it.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  async function handleImport() {
    if (!session?.apiToken || localOrphans.length === 0) return;
    setImporting(true);
    try {
      await Promise.all(
        localOrphans.map((it) =>
          authFetch("/api/my-itineraires", session.apiToken!, {
            method: "POST",
            body: JSON.stringify({ nom: it.nom, dureeKey: it.dureeKey, days: it.days }),
          })
        )
      );
      // Vider le localStorage après import
      localOrphans.forEach((it) => deleteSaved(it.id));
      setLocalOrphans([]);
      await loadItems();
    } finally {
      setImporting(false);
    }
  }

  function handleView(item: DisplayItem) {
    if (item.source === "local") {
      router.push(`/creer-itineraire?id=${encodeURIComponent(item.id)}`);
      return;
    }
    // DB : on l'injecte temporairement dans localStorage pour que creer-itineraire puisse le charger
    const existing = JSON.parse(localStorage.getItem("riviera-secrete:itineraires-custom") || "[]");
    const already = existing.find((it: SavedItineraire) => it.id === item.id);
    if (!already) {
      existing.push({ id: item.id, nom: item.nom, dureeKey: item.dureeKey, days: item.days, createdAt: item.createdAt });
      localStorage.setItem("riviera-secrete:itineraires-custom", JSON.stringify(existing));
    }
    router.push(`/creer-itineraire?id=${encodeURIComponent(item.id)}`);
  }

  if (!loaded || status === "loading") return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <nav className="text-sm mb-8 flex gap-2" style={{ color: "var(--text-muted)" }}>
        <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
        <span>/</span>
        <span style={{ color: "var(--text)" }}>Mes itinéraires</span>
      </nav>

      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Mes itinéraires</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {session
              ? "Sauvegardés sur ton compte."
              : "Sauvegardés localement sur cet appareil."}
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

      {/* Bandeau connexion si non connecté */}
      {!session && (
        <div
          className="rounded-xl p-4 mb-6 flex items-center justify-between gap-4"
          style={{ background: "var(--surface)", borderLeft: "3px solid var(--azure)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Connecte-toi pour synchroniser tes itinéraires sur tous tes appareils.
          </p>
          <button
            onClick={() => signIn("google")}
            className="text-sm px-3 py-1.5 rounded-lg border flex-shrink-0 transition-colors hover:bg-white/5 cursor-pointer"
            style={{ borderColor: "var(--line)", color: "var(--text)" }}
          >
            Connexion
          </button>
        </div>
      )}

      {/* Bandeau import localStorage → DB */}
      {session && localOrphans.length > 0 && (
        <div
          className="rounded-xl p-4 mb-6 flex items-center justify-between gap-4"
          style={{ background: "var(--surface)", borderLeft: "3px solid var(--terracotta)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {localOrphans.length} itinéraire{localOrphans.length > 1 ? "s" : ""} local{localOrphans.length > 1 ? "aux" : ""} trouvé{localOrphans.length > 1 ? "s" : ""} sur cet appareil. Les importer sur ton compte ?
          </p>
          <button
            onClick={handleImport}
            disabled={importing}
            className="text-sm px-3 py-1.5 rounded-lg flex-shrink-0 font-semibold transition-opacity disabled:opacity-50 cursor-pointer disabled:cursor-default"
            style={{ background: "var(--terracotta)", color: "#0c1116" }}
          >
            {importing ? "Import…" : "Importer"}
          </button>
        </div>
      )}

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
            const dureeLabel = DUREE_META[it.dureeKey as keyof typeof DUREE_META]?.label ?? it.dureeKey;
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
                  <button
                    onClick={() => handleView(it)}
                    className="text-sm px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5 cursor-pointer"
                    style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
                  >
                    Voir
                  </button>
                  <button
                    onClick={() => handleDelete(it.id, it.nom, it.source)}
                    disabled={deleting === it.id}
                    className="text-sm px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5 cursor-pointer disabled:opacity-50 disabled:cursor-default"
                    style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
                  >
                    {deleting === it.id ? "…" : "Supprimer"}
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
