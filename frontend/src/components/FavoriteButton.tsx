"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { authFetch } from "@/lib/api";
import { redirectToConnexion } from "@/lib/utils";

export default function FavoriteButton({ slug }: { slug: string }) {
  const t = useTranslations("lieuActions");
  const { data: session, status } = useSession();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.apiToken) return;
    authFetch("/api/favorites", session.apiToken)
      .then((r) => r.json())
      .then((slugs: string[]) => setIsFavorite(slugs.includes(slug)))
      .catch(() => {});
  }, [session, slug]);

  async function toggle() {
    if (!session) {
      redirectToConnexion();
      return;
    }
    if (!session.apiToken) {
      // Session OK mais échange backend raté — forcer un nouveau login
      redirectToConnexion();
      return;
    }
    setLoading(true);
    try {
      await authFetch(`/api/favorites/${slug}`, session.apiToken, {
        method: isFavorite ? "DELETE" : "POST",
      });
      setIsFavorite((v) => !v);
    } catch {
      // silent — état inchangé si erreur réseau
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={!session ? t("connexionRequise") : isFavorite ? t("retirerDesFavoris") : t("ajouterAuxFavoris")}
      className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors hover:bg-white/5 disabled:opacity-50 cursor-pointer disabled:cursor-default"
      style={{
        borderColor: isFavorite ? "var(--terracotta)" : "var(--line)",
        color: isFavorite ? "var(--terracotta)" : "var(--text-muted)",
      }}
    >
      <span>{isFavorite ? "♥" : "♡"}</span>
      <span>{isFavorite ? t("favori") : t("ajouterAuxFavoris")}</span>
    </button>
  );
}
