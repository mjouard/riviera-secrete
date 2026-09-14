"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5171";

/**
 * Choix d'un nouveau mot de passe depuis le lien reçu par email.
 *
 * Le jeton est lu depuis `window.location.search` et non via `useSearchParams`, comme sur
 * `/confirmer-email` : ça évite d'avoir à envelopper la page dans une frontière Suspense
 * pour un paramètre qu'on ne lit qu'une fois, au moment de l'envoi.
 *
 * Aucune session n'est ouverte après succès : on renvoie vers `/connexion`, pour que le
 * nouveau mot de passe soit saisi une fois de plus et que l'utilisateur reparte d'un état
 * qu'il connaît.
 */
export default function ReinitialiserMotDePassePage() {
  const t = useTranslations("reinitialiser");
  const tConnexion = useTranslations("connexion");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [afficher, setAfficher] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [fait, setFait] = useState(false);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);

    if (password.length < 8) return setErreur(t("tropCourt"));
    // Vérifié ici parce que le serveur ne peut pas le faire : il ne reçoit qu'un mot de
    // passe. Une faute de frappe enfermerait dehors quelqu'un qui vient déjà d'être bloqué.
    if (password !== confirmation) return setErreur(t("nonIdentiques"));

    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) return setErreur(t("lienInvalide"));

    setEnvoi(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // On traduit à partir du `code` machine : le message `error` du backend est en
        // français, l'afficher tel quel mettrait une phrase française sur /en.
        const parCode: Record<string, string> = {
          token_invalide: t("lienInvalide"),
          token_expire: t("lienExpire"),
          trop_court: t("tropCourt"),
          trop_long: t("tropLong"),
        };
        setErreur(parCode[data?.code] ?? t("echec"));
        return;
      }
      setFait(true);
      setTimeout(() => router.push("/connexion"), 2500);
    } catch {
      setErreur(t("reseau"));
    } finally {
      setEnvoi(false);
    }
  }

  if (fait) {
    return (
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-3">{t("succesTitre")}</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>{t("succesTexte")}</p>
        <Link href="/connexion" className="text-sm underline focus-ring rounded" style={{ color: "var(--azure)" }}>
          {tConnexion("seConnecter")}
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-2">{t("titre")}</h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>{t("intro")}</p>

      <form onSubmit={soumettre} className="flex flex-col gap-4">
        <div>
          <label htmlFor="nouveau" className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
            {t("nouveauMotDePasse")}
          </label>
          <div className="relative">
            <input
              id="nouveau"
              type={afficher ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
              placeholder={tConnexion("motDePassePlaceholderRegister")}
              className="focus-ring w-full text-sm px-3 py-2.5 pr-16 rounded-lg border"
              style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text)" }}
            />
            <button
              type="button"
              onClick={() => setAfficher((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs focus-ring rounded cursor-pointer"
              style={{ color: "var(--text-muted)" }}
            >
              {afficher ? tConnexion("masquer") : tConnexion("afficher")}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmation" className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
            {t("confirmer")}
          </label>
          <input
            id="confirmation"
            type={afficher ? "text" : "password"}
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            required
            autoComplete="new-password"
            className="focus-ring w-full text-sm px-3 py-2.5 rounded-lg border"
            style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text)" }}
          />
        </div>

        {erreur && (
          <p role="alert" className="text-xs rounded-lg p-3" style={{ background: "rgba(232,74,74,0.12)", color: "#E8705A" }}>
            {erreur}
          </p>
        )}

        <button
          type="submit"
          disabled={envoi}
          className="w-full text-sm font-medium px-4 py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
          style={{ background: "var(--azure)", color: "#0C1116" }}
        >
          {envoi ? tConnexion("unInstant") : t("valider")}
        </button>
      </form>

      <p className="text-sm text-center mt-6" style={{ color: "var(--text-muted)" }}>
        <Link href="/connexion" className="underline focus-ring rounded" style={{ color: "var(--azure)" }}>
          {t("retourConnexion")}
        </Link>
      </p>
    </main>
  );
}
