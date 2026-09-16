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

  /**
   * Bascule optimiste (→ EC-06).
   *
   * L'état n'était appliqué qu'au retour du serveur : 416 ms mesurés entre le clic et le
   * changement de libellé, sans indicateur — le visiteur cliquait une seconde fois, ce qui
   * annulait son propre geste. On bascule donc tout de suite et on revient en arrière si
   * l'appel échoue, plutôt que de faire attendre le cas nominal pour couvrir l'exception.
   */
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
    const cible = !isFavorite;
    setIsFavorite(cible);
    setLoading(true);
    try {
      const res = await authFetch(`/api/favorites/${slug}`, session.apiToken, {
        method: cible ? "POST" : "DELETE",
      });
      if (!res.ok) setIsFavorite(!cible);
    } catch {
      // Échec réseau : on remet l'état d'avant, sans quoi le cœur mentirait sur ce qui est
      // réellement enregistré.
      setIsFavorite(!cible);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") return null;

  return (
    <button
      onClick={toggle}
      // Toujours désactivé pendant l'appel, malgré la bascule optimiste : l'état visible a
      // déjà changé, donc l'attente ne se voit pas, et deux requêtes concurrentes dont les
      // réponses reviennent dans le désordre laisseraient le cœur désaccordé de la base.
      disabled={loading}
      aria-pressed={isFavorite}
      aria-busy={loading}
      title={!session ? t("connexionRequise") : isFavorite ? t("retirerDesFavoris") : t("ajouterAuxFavoris")}
      className="focus-ring-aube flex items-center gap-1.5 h-11 text-body px-4 rounded-full border transition-colors hover:bg-white/5 cursor-pointer"
      style={{
        borderColor: isFavorite ? "var(--aube)" : "var(--line)",
        color: isFavorite ? "var(--aube)" : "var(--brume)",
      }}
    >
      <span aria-hidden="true">{isFavorite ? "♥" : "♡"}</span>
      <span>{isFavorite ? t("favori") : t("ajouterAuxFavoris")}</span>
    </button>
  );
}
