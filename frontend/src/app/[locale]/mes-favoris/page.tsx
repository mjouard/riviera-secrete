"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { api, authFetch } from "@/lib/api";
import { loc } from "@/lib/utils";
import type { Lieu } from "@/lib/types";
import Photo from "@/components/Photo";

export default function MesFavorisPage() {
  const locale = useLocale();
  const t = useTranslations("mesFavoris");
  const tCommon = useTranslations("common");
  const tRegionFull = useTranslations("regionFull");
  const { data: session, status } = useSession();
  const [lieux, setLieux] = useState<Lieu[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.apiToken) return;

    Promise.all([
      authFetch("/api/favorites", session.apiToken).then((r) => r.json() as Promise<string[]>),
      api.lieux.list(),
    ])
      .then(([slugs, allLieux]) =>
        setLieux(allLieux.filter((l) => slugs.includes(l.slug)))
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  async function removeFavorite(slug: string) {
    if (!session?.apiToken) return;
    setRemoving(slug);
    try {
      await authFetch(`/api/favorites/${slug}`, session.apiToken, { method: "DELETE" });
      setLieux((prev) => prev.filter((l) => l.slug !== slug));
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <nav className="text-sm mb-8 flex gap-2" style={{ color: "var(--text-muted)" }}>
        <Link href="/" className="hover:text-white transition-colors">{tCommon("accueil")}</Link>
        <span>/</span>
        <span style={{ color: "var(--text)" }}>{t("breadcrumb")}</span>
      </nav>

      <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
      <p className="mb-10 text-sm" style={{ color: "var(--text-muted)" }}>
        {t("subtitle")}
      </p>

      {status === "loading" || (session && loading) ? (
        <p style={{ color: "var(--text-muted)" }}>{t("chargement")}</p>
      ) : !session ? (
        <div className="rounded-xl p-8 text-center" style={{ background: "var(--surface)" }}>
          <p className="mb-4" style={{ color: "var(--text-muted)" }}>
            {t("connecteToi")}
          </p>
          <Link
            href={`/connexion?callbackUrl=${encodeURIComponent(locale === "en" ? "/en/mes-favoris" : "/mes-favoris")}`}
            className="inline-block text-sm px-4 py-2 rounded-lg border transition-colors hover:bg-white/10"
            style={{ borderColor: "var(--line)", color: "var(--text)" }}
          >
            {t("seConnecter")}
          </Link>
        </div>
      ) : lieux.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ background: "var(--surface)" }}>
          <p className="mb-4" style={{ color: "var(--text-muted)" }}>
            {t("aucunFavori")}
          </p>
          <Link
            href="/#lieux"
            className="text-sm"
            style={{ color: "var(--azure)" }}
          >
            {t("parcourirLesLieux")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {lieux.map((lieu) => (
            <div
              key={lieu.slug}
              className="rounded-xl overflow-hidden flex flex-col"
              style={{ background: "var(--surface)" }}
            >
              <Link href={`/lieux/${lieu.slug}`} className="block aspect-video overflow-hidden">
                <Photo sizes="(max-width: 640px) 50vw, 25vw"
                  src={lieu.thumbImage}
                  alt={lieu.heroAlt}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
              </Link>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--azure)" }}>
                    {lieu.commune} · {tRegionFull(lieu.regionSlug as "menton-monaco" | "nice" | "arriere-pays" | "antibes-cannes" | "golfe-st-tropez")}
                  </p>
                  <Link
                    href={`/lieux/${lieu.slug}`}
                    className="font-semibold hover:underline"
                  >
                    {loc(locale, lieu.nomEn, lieu.nom)}
                  </Link>
                  <p
                    className="text-sm mt-1 line-clamp-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {loc(locale, lieu.descriptionEn, lieu.description)}
                  </p>
                </div>
                <button
                  onClick={() => removeFavorite(lieu.slug)}
                  disabled={removing === lieu.slug}
                  className="mt-4 self-start text-xs flex items-center gap-1 transition-colors hover:opacity-70 disabled:opacity-40 cursor-pointer disabled:cursor-default"
                  style={{ color: "var(--terracotta)" }}
                >
                  <span>♥</span>
                  <span>{removing === lieu.slug ? t("suppression") : t("retirerDesFavoris")}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
