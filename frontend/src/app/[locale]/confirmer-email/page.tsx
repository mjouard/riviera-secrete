"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { codeErreur } from "@/lib/erreurs-api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5171";

type Status = "loading" | "success" | "error";

export default function ConfirmerEmailPage() {
  const t = useTranslations("confirmerEmail");
  const tErreurs = useTranslations("erreursApi");
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function confirm() {
      const token = new URLSearchParams(window.location.search).get("token");
      if (!token) {
        setStatus("error");
        setMessage(t("lienInvalide"));
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/auth/confirm-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => null);
        if (res.ok) {
          setStatus("success");
        } else {
          setStatus("error");
          // Traduit depuis le `code` machine : le champ `error` du backend est en français.
          const code = codeErreur(data);
          setMessage(code ? tErreurs(code) : t("erreurGenerique"));
        }
      } catch {
        setStatus("error");
        setMessage(t("erreurReseau"));
      }
    }
    confirm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-sm mx-auto px-6 py-16 text-center">
      {status === "loading" && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {t("confirmationEnCours")}
        </p>
      )}

      {status === "success" && (
        <>
          <h1 className="text-2xl font-bold mb-3">{t("emailConfirme")}</h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            {t("compteActive")}
          </p>
          <Link
            href="/connexion"
            className="inline-block text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            style={{ background: "var(--azure)", color: "#0C1116" }}
          >
            {t("seConnecter")}
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <h1 className="text-2xl font-bold mb-3">{t("lienInvalideTitle")}</h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            {message}
          </p>
          <Link
            href="/connexion"
            className="text-sm underline"
            style={{ color: "var(--azure)" }}
          >
            {t("retournerConnexion")}
          </Link>
        </>
      )}
    </div>
  );
}
