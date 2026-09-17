"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { signIn } from "next-auth/react";
import { codeErreur } from "@/lib/erreurs-api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5171";

export type Mode = "login" | "register";

// ---------------------------------------------------------------------------
// Helpers partagés
// ---------------------------------------------------------------------------

/**
 * Lit le `callbackUrl` depuis `window.location.search`. Appelé dans un effet
 * côté client ; retourne "/" si absent.
 */
function lireCallbackUrl(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("callbackUrl") || "/";
}

/** Traduit l'erreur de l'API depuis son `code` machine. */
function makeMessageErreur(tErreurs: ReturnType<typeof useTranslations>) {
  return function messageErreur(corps: unknown, repli: string): string {
    const code = codeErreur(corps);
    return code ? tErreurs(code) : repli;
  };
}

function GoogleButton({
  callbackUrl,
  label,
}: {
  callbackUrl: string;
  label: string;
}) {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl })}
      className="w-full flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-lg border transition-colors hover:bg-white/10 cursor-pointer"
      style={{ borderColor: "var(--line)", color: "var(--text)" }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      {label}
    </button>
  );
}

function Separateur({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
    </div>
  );
}

function LienRetourAccueil({ label }: { label: string }) {
  return (
    <p className="text-xs text-center mt-8">
      <Link href="/" className="hover:text-white transition-colors" style={{ color: "var(--text-muted)" }}>
        {label}
      </Link>
    </p>
  );
}

// ---------------------------------------------------------------------------
// Sous-composant 1 : LoginForm
// ---------------------------------------------------------------------------

interface LoginFormProps {
  onPending: (email: string) => void;
  callbackUrl: string;
}

function LoginForm({ onPending, callbackUrl }: LoginFormProps) {
  const t = useTranslations("connexion");
  const tErreurs = useTranslations("erreursApi");
  const router = useRouter();
  const messageErreur = makeMessageErreur(tErreurs);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle");

  const suffixeCallback =
    callbackUrl && callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : "";

  async function resendConfirmation() {
    setResendStatus("sending");
    try {
      await fetch(`${API_URL}/api/auth/resend-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResendStatus("sent");
    } catch {
      setResendStatus("idle");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsConfirmation(false);
    setLoading(true);

    try {
      // On interroge d'abord l'API directement pour distinguer un mauvais mot
      // de passe d'un compte pas encore confirmé (NextAuth ne renvoie qu'une
      // erreur générique via authorize()).
      const loginRes = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!loginRes.ok) {
        const data = await loginRes.json().catch(() => null);
        if (data?.code === "email_not_confirmed") {
          setNeedsConfirmation(true);
        } else {
          setError(messageErreur(data, t("erreurIdentifiants")));
        }
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError(t("erreurIdentifiants"));
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError(t("erreurGenerique"));
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold mb-1 text-center">{t("connexionTitle")}</h1>
      <p className="text-sm text-center mb-8" style={{ color: "var(--text-muted)" }}>
        {t("subtitleLogin")}
      </p>

      <GoogleButton callbackUrl={callbackUrl} label={t("continuerAvecGoogle")} />
      <Separateur label={t("ou")} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="connexion-email" className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
            {t("email")}
          </label>
          <input
            id="connexion-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="focus-ring w-full text-base px-3 py-2.5 rounded-lg border transition-colors"
            style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text)" }}
            placeholder={t("emailPlaceholder")}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="connexion-mot-de-passe" className="text-xs" style={{ color: "var(--text-muted)" }}>
              {t("motDePasse")}
            </label>
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-xs cursor-pointer"
              style={{ color: "var(--text-muted)" }}
            >
              {showPassword ? t("masquer") : t("afficher")}
            </button>
          </div>
          <input
            id="connexion-mot-de-passe"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="focus-ring w-full text-base px-3 py-2.5 rounded-lg border transition-colors"
            style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text)" }}
            placeholder="••••••••"
          />
        </div>

        <Link
          href={`/mot-de-passe-oublie${suffixeCallback}`}
          className="self-start text-xs underline focus-ring rounded"
          style={{ color: "var(--text-muted)" }}
        >
          {t("motDePasseOublie")}
        </Link>

        {error && (
          <p role="alert" aria-live="polite" className="text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(232,74,74,0.1)", color: "#E84A4A" }}>
            {error}
          </p>
        )}

        {needsConfirmation && (
          <div
            className="text-xs px-3 py-2.5 rounded-lg flex items-center justify-between gap-3"
            style={{ background: "rgba(79,195,201,0.1)", color: "var(--azure)" }}
          >
            <span>{t("emailNonConfirme")}</span>
            <button
              type="button"
              onClick={resendConfirmation}
              disabled={resendStatus !== "idle"}
              className="underline whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              {resendStatus === "sent" ? t("renvoye") : resendStatus === "sending" ? t("envoi") : t("renvoyer")}
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full text-sm font-medium px-4 py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
          style={{ background: "var(--azure)", color: "#0C1116" }}
        >
          {loading ? t("unInstant") : t("seConnecter")}
        </button>
      </form>

      <p className="text-sm text-center mt-6" style={{ color: "var(--text-muted)" }}>
        {t("pasEncoreDeCompte")}{" "}
        <Link
          href={`/inscription${suffixeCallback}`}
          className="underline focus-ring rounded"
          style={{ color: "var(--azure)" }}
        >
          {t("creerUnCompte")}
        </Link>
      </p>

      <LienRetourAccueil label={t("retourAccueil")} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sous-composant 2 : RegisterForm
// ---------------------------------------------------------------------------

interface RegisterFormProps {
  onPending: (email: string) => void;
  callbackUrl: string;
}

function RegisterForm({ onPending, callbackUrl }: RegisterFormProps) {
  const t = useTranslations("connexion");
  const tLegal = useTranslations("legal");
  const tErreurs = useTranslations("erreursApi");
  const messageErreur = makeMessageErreur(tErreurs);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suffixeCallback =
    callbackUrl && callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : "";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nom }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(messageErreur(data, t("erreurCreationCompte")));
        setLoading(false);
        return;
      }
      // Inscription ok mais compte pas encore confirmé — pas de session tant que
      // l'email n'est pas validé.
      onPending(data?.email ?? email);
    } catch {
      setError(t("erreurGenerique"));
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold mb-1 text-center">{t("creerCompteTitle")}</h1>
      <p className="text-sm text-center mb-8" style={{ color: "var(--text-muted)" }}>
        {t("subtitleRegister")}
      </p>

      <GoogleButton callbackUrl={callbackUrl} label={t("continuerAvecGoogle")} />
      <Separateur label={t("ou")} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="inscription-nom" className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
            {t("nom")}
          </label>
          <input
            id="inscription-nom"
            type="text"
            required
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="focus-ring w-full text-base px-3 py-2.5 rounded-lg border transition-colors"
            style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text)" }}
            placeholder={t("nomPlaceholder")}
          />
        </div>

        <div>
          <label htmlFor="inscription-email" className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
            {t("email")}
          </label>
          <input
            id="inscription-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="focus-ring w-full text-base px-3 py-2.5 rounded-lg border transition-colors"
            style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text)" }}
            placeholder={t("emailPlaceholder")}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="inscription-mot-de-passe" className="text-xs" style={{ color: "var(--text-muted)" }}>
              {t("motDePasse")}
            </label>
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-xs cursor-pointer"
              style={{ color: "var(--text-muted)" }}
            >
              {showPassword ? t("masquer") : t("afficher")}
            </button>
          </div>
          <input
            id="inscription-mot-de-passe"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="focus-ring w-full text-base px-3 py-2.5 rounded-lg border transition-colors"
            style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text)" }}
            placeholder={t("motDePassePlaceholderRegister")}
          />
        </div>

        {error && (
          <p role="alert" aria-live="polite" className="text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(232,74,74,0.1)", color: "#E84A4A" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full text-sm font-medium px-4 py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
          style={{ background: "var(--azure)", color: "#0C1116" }}
        >
          {loading ? t("unInstant") : t("creerMonCompte")}
        </button>

        {/* Information RGPD au moment de la collecte, et non seulement en pied de page :
            c'est ici que le visiteur confie son adresse. Formulé en une phrase qui dit ce
            qui est réellement fait de la donnée, plutôt qu'un renvoi sec au texte. */}
        <p className="text-xs mt-4 leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {t("mentionRgpd")}{" "}
          <Link href="/confidentialite" className="underline focus-ring rounded" style={{ color: "var(--azure)" }}>
            {tLegal("confidentialiteTitre")}
          </Link>
          .
        </p>
      </form>

      <p className="text-sm text-center mt-6" style={{ color: "var(--text-muted)" }}>
        {t("dejaUnCompte")}{" "}
        <Link
          href={`/connexion${suffixeCallback}`}
          className="underline focus-ring rounded"
          style={{ color: "var(--azure)" }}
        >
          {t("seConnecter")}
        </Link>
      </p>

      <LienRetourAccueil label={t("retourAccueil")} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sous-composant 3 : PendingConfirmationForm
// ---------------------------------------------------------------------------

interface PendingConfirmationFormProps {
  email: string;
  onBack: () => void;
}

function PendingConfirmationForm({ email }: PendingConfirmationFormProps) {
  const t = useTranslations("connexion");
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle");

  async function resendConfirmation() {
    setResendStatus("sending");
    try {
      await fetch(`${API_URL}/api/auth/resend-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResendStatus("sent");
    } catch {
      setResendStatus("idle");
    }
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16 text-center">
      <h1 className="text-2xl font-bold mb-3">{t("verifieTaBoiteMail")}</h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        {t.rich("lienEnvoyeA", {
          email,
          bold: (chunks: ReactNode) => <strong style={{ color: "var(--text)" }}>{chunks}</strong>,
        })}
      </p>
      <button
        onClick={resendConfirmation}
        disabled={resendStatus !== "idle"}
        className="text-sm px-4 py-2 rounded-lg border transition-colors hover:bg-white/10 cursor-pointer disabled:opacity-50 disabled:cursor-default"
        style={{ borderColor: "var(--line)", color: "var(--text)" }}
      >
        {resendStatus === "sent" ? t("emailRenvoye") : resendStatus === "sending" ? t("envoi") : t("renvoyerLEmail")}
      </button>
      <LienRetourAccueil label={t("retourAccueil")} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Orchestrateur exporté — interface publique inchangée
// ---------------------------------------------------------------------------

/**
 * Formulaire d'authentification partagé par /connexion et /inscription.
 *
 * La prop `mode` fixe la vue initiale (login ou register). Les transitions
 * entre vues (login ↔ register via liens URL, login/register → pending via
 * callback) sont gérées localement par l'orchestrateur.
 */
export default function FormulaireAuth({ mode }: { mode: Mode }) {
  const [vue, setVue] = useState<"login" | "register" | "pending">(mode);
  const [pendingEmail, setPendingEmail] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("/");

  useEffect(() => {
    setCallbackUrl(lireCallbackUrl());
  }, []);

  function handlePending(email: string) {
    setPendingEmail(email);
    setVue("pending");
  }

  if (vue === "pending") {
    return (
      <PendingConfirmationForm
        email={pendingEmail}
        onBack={() => setVue("login")}
      />
    );
  }

  if (vue === "register") {
    return (
      <RegisterForm
        onPending={handlePending}
        callbackUrl={callbackUrl}
      />
    );
  }

  return (
    <LoginForm
      onPending={handlePending}
      callbackUrl={callbackUrl}
    />
  );
}
