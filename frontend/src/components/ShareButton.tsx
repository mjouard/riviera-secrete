"use client";

import { useState } from "react";

export default function ShareButton({ title }: { title: string }) {
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

  return (
    <button
      onClick={handleClick}
      className="text-xs px-3 py-1.5 rounded-full border transition-colors hover:bg-white/5 cursor-pointer"
      style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
    >
      {copied ? "Lien copié ✓" : "🔗 Partager"}
    </button>
  );
}
