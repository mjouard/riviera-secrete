"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";
import { loc } from "@/lib/utils";
import { lireParam, ecrireFiltres, useSearchString } from "@/lib/url-filtres";
import { DUREE_META } from "@/lib/itineraire-logic";
import type { Session } from "next-auth";
import type { Lieu, UserItineraire } from "@/lib/types";
import Photo from "@/components/Photo";

const ONGLETS = ["favoris", "itineraires"] as const;
type Onglet = (typeof ONGLETS)[number];

function useCarnetData(session: Session | null) {
  const [favLieux, setFavLieux] = useState<Lieu[]>([]);
  const [itinItems, setItinItems] = useState<UserItineraire[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pas de session → on ne bascule jamais loading à "chargé" : ce cas ne consulte jamais
    // ce flag (voir le rendu plus bas, branche `!session`), donc rien à synchroniser.
    if (!session) return;
    setLoading(true);
    Promise.all([
      fetch("/api/proxy/favorites").then((r) => r.json() as Promise<string[]>),
      api.lieux.list(),
      fetch("/api/proxy/my-itineraires").then((r) => (r.ok ? (r.json() as Promise<UserItineraire[]>) : [])),
    ])
      .then(([slugs, allLieux, itins]) => {
        setFavLieux(allLieux.filter((l) => slugs.includes(l.slug)));
        setItinItems(itins.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  return { favLieux, setFavLieux, itinItems, setItinItems, loading };
}

/**
 * Refonte UI Lot 5 — fusionne /mes-favoris et /mes-itineraires en une seule entrée à deux
 * onglets (corrige NF-05 : deux entrées cul-de-sac dans la nav pour 100 % des nouveaux
 * visiteurs). Onglet dans l'URL (`?onglet=favoris|itineraires`, contrat du Lot 2 —
 * `url-filtres.ts`) : `/mes-favoris`/`/mes-itineraires` redirigent maintenant vers
 * `/carnet?onglet=…` (voir next.config.ts), donc un lien externe/marque-page existant doit
 * atterrir sur le bon onglet, pas toujours le premier.
 *
 * Un seul palier de connexion (pas un par onglet) : les deux onglets dépendent de la même
 * session, dupliquer le bloc "connecte-toi" n'apporterait rien.
 */
export default function CarnetPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("carnet");
  const tFav = useTranslations("mesFavoris");
  const tItin = useTranslations("mesItineraires");
  const tDuree = useTranslations("dureeLabels");
  const tRegionFull = useTranslations("regionFull");
  const { data: session, status } = useSession();

  const search = useSearchString();
  const onglet: Onglet = lireParam(search, "onglet", ONGLETS) || "favoris";
  const setOnglet = useCallback((v: Onglet) => ecrireFiltres({ onglet: v }), []);

  const { favLieux, setFavLieux, itinItems, setItinItems, loading } = useCarnetData(session);
  const [removingFav, setRemovingFav] = useState<string | null>(null);
  const [deletingItin, setDeletingItin] = useState<string | null>(null);

  async function removeFavorite(slug: string) {
    if (!session) return;
    setRemovingFav(slug);
    try {
      await fetch(`/api/proxy/favorites/${slug}`, { method: "DELETE" });
      setFavLieux((prev) => prev.filter((l) => l.slug !== slug));
    } finally {
      setRemovingFav(null);
    }
  }

  async function deleteItineraire(id: string, nom: string) {
    if (!confirm(tItin("confirmSuppression", { nom }))) return;
    if (!session) return;
    setDeletingItin(id);
    try {
      await fetch(`/api/proxy/my-itineraires/${id}`, { method: "DELETE" });
      setItinItems((prev) => prev.filter((it) => it.id !== id));
    } finally {
      setDeletingItin(null);
    }
  }

  const callbackUrl = encodeURIComponent(locale === "en" ? `/en/carnet?onglet=${onglet}` : `/carnet?onglet=${onglet}`);
  const loadingAuth = status === "loading";

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <nav className="text-sm mb-8 flex gap-2" style={{ color: "var(--text-muted)" }}>
        <Link href="/" className="hover:text-white transition-colors">{t("accueil")}</Link>
        <span>/</span>
        <span style={{ color: "var(--text)" }}>{t("breadcrumb")}</span>
      </nav>

      <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
      <p className="mb-8 text-sm" style={{ color: "var(--text-muted)" }}>{t("subtitle")}</p>

      <div className="flex gap-2 mb-8 border-b" style={{ borderColor: "var(--line)" }}>
        {ONGLETS.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => setOnglet(o)}
            className="px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-colors cursor-pointer"
            style={
              onglet === o
                ? { borderColor: "var(--terracotta)", color: "var(--text)" }
                : { borderColor: "transparent", color: "var(--text-muted)" }
            }
          >
            {o === "favoris" ? t("ongletFavoris") : t("ongletItineraires")}
            {session && !loading && (
              <span className="ml-1.5" style={{ color: "var(--text-muted)" }}>
                ({o === "favoris" ? favLieux.length : itinItems.length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loadingAuth ? null : !session ? (
        <div className="rounded-xl p-8 text-center" style={{ background: "var(--surface)" }}>
          <p className="mb-4" style={{ color: "var(--text-muted)" }}>{t("connecteToi")}</p>
          <Link
            href={`/connexion?callbackUrl=${callbackUrl}`}
            className="inline-block text-sm px-4 py-2 rounded-lg border transition-colors hover:bg-white/10"
            style={{ borderColor: "var(--line)", color: "var(--text)" }}
          >
            {t("seConnecter")}
          </Link>
        </div>
      ) : onglet === "favoris" ? (
        loading ? (
          <p style={{ color: "var(--text-muted)" }}>{tFav("chargement")}</p>
        ) : favLieux.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ background: "var(--surface)" }}>
            <p className="mb-4" style={{ color: "var(--text-muted)" }}>{tFav("aucunFavori")}</p>
            <Link href="/#explorer" className="text-sm" style={{ color: "var(--azure)" }}>
              {tFav("parcourirLesLieux")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {favLieux.map((lieu) => (
              <div key={lieu.slug} className="rounded-xl overflow-hidden flex flex-col" style={{ background: "var(--surface)" }}>
                <Link href={`/lieux/${lieu.slug}`} className="block aspect-video overflow-hidden">
                  <Photo sizes="(max-width: 640px) 50vw, 25vw" src={lieu.thumbImage} alt={lieu.heroAlt} className="w-full h-full object-cover transition-transform hover:scale-105" />
                </Link>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs mb-1" style={{ color: "var(--azure)" }}>
                      {lieu.commune} · {tRegionFull(lieu.regionSlug as "menton-monaco" | "nice" | "arriere-pays" | "antibes-cannes" | "golfe-st-tropez")}
                    </p>
                    <Link href={`/lieux/${lieu.slug}`} className="font-semibold hover:underline">
                      {loc(locale, lieu.nomEn, lieu.nom)}
                    </Link>
                    <p className="text-sm mt-1 line-clamp-2" style={{ color: "var(--text-muted)" }}>
                      {loc(locale, lieu.descriptionEn, lieu.description)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFavorite(lieu.slug)}
                    disabled={removingFav === lieu.slug}
                    className="mt-4 self-start text-xs flex items-center gap-1 transition-colors hover:opacity-70 disabled:opacity-40 cursor-pointer disabled:cursor-default"
                    style={{ color: "var(--terracotta)" }}
                  >
                    <span>♥</span>
                    <span>{removingFav === lieu.slug ? tFav("suppression") : tFav("retirerDesFavoris")}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : loading ? null : itinItems.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "var(--surface)" }}>
          <p className="text-lg font-semibold mb-2">{tItin("aucunItineraire")}</p>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>{tItin("composePremier")}</p>
          <Link href="/composer" className="inline-block text-sm px-5 py-2.5 rounded-xl font-semibold" style={{ background: "var(--terracotta)", color: "#0c1116" }}>
            {tItin("creerItineraire")}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {itinItems.map((it) => {
            const nbLieux = it.days.reduce((n, day) => n + day.length, 0);
            const dureeLabel = it.dureeKey in DUREE_META ? tDuree(it.dureeKey as keyof typeof DUREE_META) : it.dureeKey;
            const date = new Date(it.createdAt).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });
            return (
              <div key={it.id} className="rounded-xl p-5 flex items-center justify-between gap-4" style={{ background: "var(--surface)" }}>
                <div className="min-w-0">
                  <h2 className="font-semibold mb-1 line-clamp-1">{it.nom}</h2>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>{dureeLabel}</span>
                    <span>📍 {nbLieux} {nbLieux > 1 ? tItin("lieux") : tItin("lieu")}</span>
                    <span>{date}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => router.push(`/creer-itineraire?id=${encodeURIComponent(it.id)}`)}
                    className="text-sm px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5 cursor-pointer"
                    style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
                  >
                    {tItin("voir")}
                  </button>
                  <button
                    onClick={() => deleteItineraire(it.id, it.nom)}
                    disabled={deletingItin === it.id}
                    className="text-sm px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5 cursor-pointer disabled:opacity-50 disabled:cursor-default"
                    style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
                  >
                    {deletingItin === it.id ? "…" : tItin("supprimer")}
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
