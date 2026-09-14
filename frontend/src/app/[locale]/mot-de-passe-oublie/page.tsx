"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5171";

/**
 * Refonte UI Lot 2 — première étape de la réinitialisation, devenue une route à part.
 *
 * Elle vivait en troisième état de /connexion, réutilisant le champ e-mail du formulaire de
 * connexion : aucune URL propre, donc aucun lien envoyable ni mesure d'entonnoir possible.
 * La seconde étape (choisir le nouveau mot de passe depuis le lien reçu) a sa propre route
 * depuis le 2026-09-14, /reinitialiser-mot-de-passe, et ne bouge pas.
 *
 * Rien à changer côté backend : l'endpoint /api/auth/forgot-password existe déjà.
 */
export default function MotDePasseOubliePage() {
  const t = useTranslations("connexion");
  const [email, setEmail] = useState("");
  const [statut, setStatut] = useState<"idle" | "sending" | "sent">("idle");

  /**
   * Le retour est volontairement le même que l'adresse existe ou non — c'est ce que répond le
   * backend, et l'afficher autrement ici annulerait la précaution.
   */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatut("sending");
    try {
      await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch {
      // Même en cas d'échec réseau on affiche le message générique : réessayer est la seule
      // action utile, et un message d'erreur distinct renseignerait un attaquant.
    }
    setStatut("sent");
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold mb-1 text-center">{t("oubliTitre")}</h1>
      <p className="text-sm text-center mb-8" style={{ color: "var(--text-muted)" }}>
        {t("oubliSousTitre")}
      </p>

      {statut === "sent" ? (
        <p
          className="text-xs px-3 py-2.5 rounded-lg"
          style={{ background: "rgba(79,195,201,0.1)", color: "var(--azure)" }}
        >
          {t("oubliEnvoye")}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="oubli-email" className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
              {t("email")}
            </label>
            <input
              id="oubli-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="focus-ring w-full text-sm px-3 py-2.5 rounded-lg border transition-colors"
              style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text)" }}
              placeholder={t("emailPlaceholder")}
            />
          </div>

          <button
            type="submit"
            disabled={statut === "sending"}
            className="w-full text-sm font-medium px-4 py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
            style={{ background: "var(--azure)", color: "#0C1116" }}
          >
            {statut === "sending" ? t("envoi") : t("oubliEnvoyerLeLien")}
          </button>
        </form>
      )}

      <p className="text-sm text-center mt-6" style={{ color: "var(--text-muted)" }}>
        <Link href="/connexion" className="underline focus-ring rounded" style={{ color: "var(--azure)" }}>
          {t("seConnecter")}
        </Link>
      </p>

      <p className="text-xs text-center mt-8">
        <Link href="/" className="hover:text-white transition-colors" style={{ color: "var(--text-muted)" }}>
          {t("retourAccueil")}
        </Link>
      </p>
    </div>
  );
}
