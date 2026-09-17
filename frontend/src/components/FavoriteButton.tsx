"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { redirectToConnexion } from "@/lib/utils";

export default function FavoriteButton({
  slug,
  variant = "pill",
}: {
  slug: string;
  /** "square" — carré 52×52 icône seule, pour la barre d'action fixe mobile (Lot 4a). */
  variant?: "pill" | "square";
}) {
  const t = useTranslations("lieuActions");
  const { data: session, status } = useSession();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch("/api/proxy/favorites")
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
    const cible = !isFavorite;
    setIsFavorite(cible);
    setLoading(true);
    try {
      const res = await fetch(`/api/proxy/favorites/${slug}`, {
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

  const title = !session ? t("connexionRequise") : isFavorite ? t("retirerDesFavoris") : t("ajouterAuxFavoris");
  const borderColor = isFavorite ? "var(--aube)" : "var(--line)";
  const color = isFavorite ? "var(--aube)" : "var(--brume)";

  if (variant === "square") {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        aria-pressed={isFavorite}
        aria-busy={loading}
        title={title}
        className="focus-ring-aube w-[52px] h-[52px] flex-shrink-0 flex items-center justify-center text-xl rounded-lg border transition-colors hover:bg-white/5 cursor-pointer"
        style={{ borderColor, color, background: "var(--nuit-haute)" }}
      >
        <span aria-hidden="true">{isFavorite ? "♥" : "♡"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      // Toujours désactivé pendant l'appel, malgré la bascule optimiste : l'état visible a
      // déjà changé, donc l'attente ne se voit pas, et deux requêtes concurrentes dont les
      // réponses reviennent dans le désordre laisseraient le cœur désaccordé de la base.
      disabled={loading}
      aria-pressed={isFavorite}
      aria-busy={loading}
      title={title}
      className="focus-ring-aube flex items-center gap-1.5 h-11 text-body px-4 rounded-full border transition-colors hover:bg-white/5 cursor-pointer"
      style={{ borderColor, color }}
    >
      <span aria-hidden="true">{isFavorite ? "♥" : "♡"}</span>
      <span>{isFavorite ? t("favori") : t("ajouterAuxFavoris")}</span>
    </button>
  );
}
