"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function ShareButton({
  title,
  variant = "pill",
}: {
  title: string;
  /** "square" — carré 52×52 icône seule, pour la barre d'action fixe mobile (Lot 4a). */
  variant?: "pill" | "square";
}) {
  const t = useTranslations("lieuActions");
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return; // annulé par l'utilisateur
      }
    }

    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent
    }
  }

  if (variant === "square") {
    return (
      <button
        onClick={handleClick}
        title={t("partager")}
        className="focus-ring-aube w-[52px] h-[52px] flex-shrink-0 flex items-center justify-center text-lg rounded-lg border transition-colors hover:bg-white/5 cursor-pointer"
        style={{ borderColor: "var(--line)", color: "var(--brume)", background: "var(--nuit-haute)" }}
      >
        <span aria-hidden="true">{copied ? "✓" : "🔗"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="focus-ring-aube inline-flex items-center h-11 text-body px-4 rounded-full border transition-colors hover:bg-white/5 cursor-pointer"
      style={{ borderColor: "var(--line)", color: "var(--brume)" }}
    >
      {copied ? t("lienCopie") : t("partager")}
    </button>
  );
}
