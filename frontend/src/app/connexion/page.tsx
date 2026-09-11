"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5171";

type Mode = "login" | "register";

export default function ConnexionPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [callbackUrl, setCallbackUrl] = useState("/");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCallbackUrl(params.get("callbackUrl") || "/");
  }, []);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNeedsConfirmation(false);
  }

  async function resendConfirmation(targetEmail: string) {
    setResendStatus("sending");
    try {
      await fetch(`${API_URL}/api/auth/resend-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
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
      if (mode === "register") {
        const res = await fetch(`${API_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, nom }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setError(data?.error ?? "Impossible de créer le compte.");
          setLoading(false);
          return;
        }
        // Inscription ok mais compte pas encore confirmé — pas de session tant que
        // l'email n'est pas validé.
        setPendingEmail(data?.email ?? email);
        setLoading(false);
        return;
      }

      // Login : on interroge d'abord l'API directement pour distinguer un mauvais mot
      // de passe d'un compte pas encore confirmé (NextAuth ne renvoie qu'une erreur
      // générique via authorize()).
      const loginRes = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!loginRes.ok) {
        const data = await loginRes.json().catch(() => null);
        if (data?.code === "email_not_confirmed") {
          setNeedsConfirmation(true);
          setPendingEmail(email);
        } else {
          setError(data?.error ?? "Email ou mot de passe incorrect.");
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
        setError("Email ou mot de passe incorrect.");
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Une erreur est survenue. Réessaie.");
      setLoading(false);
    }
  }

  if (pendingEmail && !needsConfirmation) {
    return (
      <div className="max-w-sm mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-bold mb-3">Vérifie ta boîte mail</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          On a envoyé un lien de confirmation à <strong style={{ color: "var(--text)" }}>{pendingEmail}</strong>.
          Clique dessus pour activer ton compte.
        </p>
        <button
          onClick={() => resendConfirmation(pendingEmail)}
          disabled={resendStatus !== "idle"}
          className="text-sm px-4 py-2 rounded-lg border transition-colors hover:bg-white/10 cursor-pointer disabled:opacity-50 disabled:cursor-default"
          style={{ borderColor: "var(--line)", color: "var(--text)" }}
        >
          {resendStatus === "sent" ? "Email renvoyé ✓" : resendStatus === "sending" ? "Envoi…" : "Renvoyer l'email"}
        </button>
        <p className="text-xs text-center mt-8">
          <Link href="/" className="hover:text-white transition-colors" style={{ color: "var(--text-muted)" }}>
            ← Retour à l&apos;accueil
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold mb-1 text-center">
        {mode === "login" ? "Connexion" : "Créer un compte"}
      </h1>
      <p className="text-sm text-center mb-8" style={{ color: "var(--text-muted)" }}>
        {mode === "login"
          ? "Retrouve tes favoris et tes itinéraires."
          : "Pour sauvegarder tes favoris et itinéraires."}
      </p>

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
        Continuer avec Google
      </button>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>ou</span>
        <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === "register" && (
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
              Nom
            </label>
            <input
              type="text"
              required
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full text-sm px-3 py-2.5 rounded-lg border outline-none focus:border-white/30 transition-colors"
              style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text)" }}
              placeholder="Ton prénom"
            />
          </div>
        )}

        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
            Email
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full text-sm px-3 py-2.5 rounded-lg border outline-none focus:border-white/30 transition-colors"
            style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text)" }}
            placeholder="toi@exemple.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs" style={{ color: "var(--text-muted)" }}>
              Mot de passe
            </label>
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-xs cursor-pointer"
              style={{ color: "var(--text-muted)" }}
            >
              {showPassword ? "Masquer" : "Afficher"}
            </button>
          </div>
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={mode === "register" ? 8 : undefined}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full text-sm px-3 py-2.5 rounded-lg border outline-none focus:border-white/30 transition-colors"
            style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text)" }}
            placeholder={mode === "register" ? "8 caractères minimum" : "••••••••"}
          />
        </div>

        {error && (
          <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(232,74,74,0.1)", color: "#E84A4A" }}>
            {error}
          </p>
        )}

        {needsConfirmation && pendingEmail && (
          <div
            className="text-xs px-3 py-2.5 rounded-lg flex items-center justify-between gap-3"
            style={{ background: "rgba(79,195,201,0.1)", color: "var(--azure)" }}
          >
            <span>Ton email n&apos;est pas encore confirmé.</span>
            <button
              type="button"
              onClick={() => resendConfirmation(pendingEmail)}
              disabled={resendStatus !== "idle"}
              className="underline whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              {resendStatus === "sent" ? "Renvoyé ✓" : resendStatus === "sending" ? "Envoi…" : "Renvoyer"}
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full text-sm font-medium px-4 py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
          style={{ background: "var(--azure)", color: "#0C1116" }}
        >
          {loading
            ? "Un instant…"
            : mode === "login"
              ? "Se connecter"
              : "Créer mon compte"}
        </button>
      </form>

      <p className="text-sm text-center mt-6" style={{ color: "var(--text-muted)" }}>
        {mode === "login" ? (
          <>
            Pas encore de compte ?{" "}
            <button onClick={() => switchMode("register")} className="cursor-pointer" style={{ color: "var(--azure)" }}>
              Créer un compte
            </button>
          </>
        ) : (
          <>
            Déjà un compte ?{" "}
            <button onClick={() => switchMode("login")} className="cursor-pointer" style={{ color: "var(--azure)" }}>
              Se connecter
            </button>
          </>
        )}
      </p>

      <p className="text-xs text-center mt-8">
        <Link href="/" className="hover:text-white transition-colors" style={{ color: "var(--text-muted)" }}>
          ← Retour à l&apos;accueil
        </Link>
      </p>
    </div>
  );
}
