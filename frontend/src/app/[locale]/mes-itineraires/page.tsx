"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { DUREE_META } from "@/lib/itineraire-logic";
import { authFetch } from "@/lib/api";
import type { UserItineraire } from "@/lib/types";

export default function MesItinerairesPage() {
  const locale = useLocale();
  const t = useTranslations("mesItineraires");
  const tCommon = useTranslations("common");
  const tDuree = useTranslations("dureeLabels");
  const { data: session, status } = useSession();
  const router = useRouter();

  const [items, setItems] = useState<UserItineraire[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    if (session?.apiToken) {
      const res = await authFetch("/api/my-itineraires", session.apiToken).then((r) =>
        r.ok ? (r.json() as Promise<UserItineraire[]>) : []
      );
      setItems(
        (res as UserItineraire[]).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } else {
      setItems([]);
    }
    setLoaded(true);
  }, [session]);

  useEffect(() => {
    function run() {
      if (status !== "loading") loadItems();
    }
    run();
  }, [loadItems, status]);

  async function handleDelete(id: string, nom: string) {
    if (!confirm(t("confirmSuppression", { nom }))) return;
    if (!session?.apiToken) return;
    setDeleting(id);
    try {
      await authFetch(`/api/my-itineraires/${id}`, session.apiToken, { method: "DELETE" });
      setItems((prev) => prev.filter((it) => it.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  if (!loaded || status === "loading") return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <nav className="text-sm mb-8 flex gap-2" style={{ color: "var(--text-muted)" }}>
        <Link href="/" className="hover:text-white transition-colors">{tCommon("accueil")}</Link>
        <span>/</span>
        <span style={{ color: "var(--text)" }}>{t("breadcrumb")}</span>
      </nav>

      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">{t("title")}</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {session ? t("subtitleConnecte") : t("subtitleDeconnecte")}
          </p>
        </div>
        <Link
          href="/creer-itineraire"
          className="text-sm px-4 py-2 rounded-xl font-semibold flex-shrink-0"
          style={{ background: "var(--terracotta)", color: "#0c1116" }}
        >
          {t("creer")}
        </Link>
      </div>

      {!session && (
        <div
          className="rounded-xl p-4 mb-6 flex items-center justify-between gap-4"
          style={{ background: "var(--surface)", borderLeft: "3px solid var(--azure)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t("connecteToiBanner")}
          </p>
          <Link
            href={`/connexion?callbackUrl=${encodeURIComponent(locale === "en" ? "/en/mes-itineraires" : "/mes-itineraires")}`}
            className="text-sm px-3 py-1.5 rounded-lg border flex-shrink-0 transition-colors hover:bg-white/5"
            style={{ borderColor: "var(--line)", color: "var(--text)" }}
          >
            {t("connexion")}
          </Link>
        </div>
      )}

      {session && items.length === 0 && (
        <div className="rounded-2xl p-12 text-center" style={{ background: "var(--surface)" }}>
          <p className="text-lg font-semibold mb-2">{t("aucunItineraire")}</p>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            {t("composePremier")}
          </p>
          <Link
            href="/creer-itineraire"
            className="inline-block text-sm px-5 py-2.5 rounded-xl font-semibold"
            style={{ background: "var(--terracotta)", color: "#0c1116" }}
          >
            {t("creerItineraire")}
          </Link>
        </div>
      )}

      {session && items.length > 0 && (
        <div className="space-y-3">
          {items.map((it) => {
            const nbLieux = it.days.reduce((n, day) => n + day.length, 0);
            const dureeLabel =
              it.dureeKey in DUREE_META ? tDuree(it.dureeKey as keyof typeof DUREE_META) : it.dureeKey;
            const date = new Date(it.createdAt).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });

            return (
              <div
                key={it.id}
                className="rounded-xl p-5 flex items-center justify-between gap-4"
                style={{ background: "var(--surface)" }}
              >
                <div className="min-w-0">
                  <h2 className="font-semibold mb-1 line-clamp-1">{it.nom}</h2>
                  <div
                    className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <span>{dureeLabel}</span>
                    <span>📍 {nbLieux} {nbLieux > 1 ? t("lieux") : t("lieu")}</span>
                    <span>{date}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() =>
                      router.push(`/creer-itineraire?id=${encodeURIComponent(it.id)}`)
                    }
                    className="text-sm px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5 cursor-pointer"
                    style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
                  >
                    {t("voir")}
                  </button>
                  <button
                    onClick={() => handleDelete(it.id, it.nom)}
                    disabled={deleting === it.id}
                    className="text-sm px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5 cursor-pointer disabled:opacity-50 disabled:cursor-default"
                    style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
                  >
                    {deleting === it.id ? "…" : t("supprimer")}
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
