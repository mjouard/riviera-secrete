"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5171";

type Status = "loading" | "success" | "error";

export default function ConfirmerEmailPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("error");
      setMessage("Lien de confirmation invalide.");
      return;
    }

    fetch(`${API_URL}/api/auth/confirm-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (res.ok) {
          setStatus("success");
        } else {
          setStatus("error");
          setMessage(data?.error ?? "Impossible de confirmer cet email.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Une erreur est survenue. Réessaie.");
      });
  }, []);

  return (
    <div className="max-w-sm mx-auto px-6 py-16 text-center">
      {status === "loading" && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Confirmation en cours…
        </p>
      )}

      {status === "success" && (
        <>
          <h1 className="text-2xl font-bold mb-3">Email confirmé ✓</h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Ton compte est activé, tu peux maintenant te connecter.
          </p>
          <Link
            href="/connexion"
            className="inline-block text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            style={{ background: "var(--azure)", color: "#0C1116" }}
          >
            Se connecter
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <h1 className="text-2xl font-bold mb-3">Lien invalide</h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            {message}
          </p>
          <Link
            href="/connexion"
            className="text-sm underline"
            style={{ color: "var(--azure)" }}
          >
            Retourner à la connexion
          </Link>
        </>
      )}
    </div>
  );
}
