"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSession, signOut } from "next-auth/react";
import { Link, useRouter } from "@/i18n/navigation";
import { Field } from "@/components/ui/Field";
import { LinkButton } from "@/components/ui/Button";
import { IconSearch } from "@/components/ui/Icons";
import LanguageSwitcher from "./LanguageSwitcher";

/**
 * Refonte UI Lot 5 (03-architecture-routes-url.md § 2) — 3 entrées (Explorer/Itinéraires/Le
 * carnet) au lieu des 6 précédentes (Lieux/Activités/Itinéraires/Villes/Créer un itinéraire/
 * Le carnet) : Activités et Villes sont des filtres d'Explorer, pas des destinations à part
 * (→ PA-02) ; "Créer un itinéraire" devient le bouton primaire "Composer un itinéraire" dans
 * l'en-tête (vers /composer, l'outil principal depuis le Lot 4e), plus une entrée sur 6.
 */
function useNavLinks() {
  const t = useTranslations("nav");
  const contentLinks = [
    { href: "/explorer", label: t("explorer") },
    { href: "/itineraires", label: t("itineraires") },
    { href: "/carnet", label: t("carnet") },
  ];
  return { contentLinks };
}

function AuthButton({ onClose }: { onClose?: () => void }) {
  const t = useTranslations("nav");
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (session) {
    return (
      <button
        onClick={() => { signOut(); onClose?.(); }}
        className="text-sm transition-colors hover:text-white cursor-pointer"
        style={{ color: "var(--text-muted)" }}
      >
        {session.user?.name?.split(" ")[0] ?? "..."} · {t("deconnexion")}
      </button>
    );
  }

  return (
    <Link
      href="/connexion"
      onClick={onClose}
      className="text-sm px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/10"
      style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
    >
      {t("connexion")}
    </Link>
  );
}

/**
 * Recherche globale (→ AI-06) — un vrai champ, pas la loupe qui rechargeait l'accueil et
 * sautait vers une ancre. Soumet vers /explorer?q=…, qui sait déjà filtrer sur ce paramètre
 * (ExplorerShell.tsx) : pas de nouvelle logique de recherche, juste un point d'entrée de plus
 * vers celle qui existe.
 */
function RechercheGlobale({ className, onSubmitted }: { className?: string; onSubmitted?: () => void }) {
  const t = useTranslations("nav");
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/explorer?q=${encodeURIComponent(q.trim())}`);
    onSubmitted?.();
  }

  return (
    <form onSubmit={submit} className={`relative ${className ?? ""}`}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--brume)" }}>
        <IconSearch className="w-4 h-4" />
      </span>
      <Field
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label={t("rechercher")}
        placeholder={t("rechercher")}
        style={{ paddingLeft: "36px", height: "38px", minHeight: "38px" }}
      />
    </form>
  );
}

export default function NavHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const t = useTranslations("nav");
  const { contentLinks } = useNavLinks();

  return (
    <header
      className="sticky top-0 z-10 border-b"
      style={{
        background: "rgba(12,17,22,0.85)",
        backdropFilter: "blur(8px)",
        borderColor: "var(--line)",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-1.5 lg:py-4 flex items-center justify-between gap-4">
        <Link
          href="/"
          onClick={close}
          className="font-display text-lg font-semibold tracking-tight flex-shrink-0"
          style={{ color: "var(--text)" }}
        >
          Riviera Secrète
        </Link>

        {/* Barre complète à partir de lg (1024px) : 3 entrées + recherche + bouton primaire
            + sélecteur de langue + compte tiennent large, mais pas en dessous. */}
        <nav className="hidden lg:flex gap-6 items-center text-sm flex-1 justify-end" style={{ color: "var(--text-muted)" }}>
          {contentLinks.map(({ href, label }) => (
            <Link key={href} href={href} className="hover:text-white transition-colors flex-shrink-0">
              {label}
            </Link>
          ))}
          <RechercheGlobale className="w-[250px] flex-shrink-0" />
          <LanguageSwitcher />
          <AuthButton />
          <LinkButton href="/composer" variant="primaire" className="flex-shrink-0">
            {t("composer")}
          </LinkButton>
        </nav>

        {/* Mobile : logo + loupe 44×44 + burger 44×44 (spec § 2) — la recherche complète vit
            sur /explorer, la loupe y mène directement plutôt que de dupliquer un champ dans
            une barre déjà étroite. */}
        <div className="lg:hidden flex items-center">
          <Link
            href="/explorer"
            title={t("rechercher")}
            aria-label={t("rechercher")}
            className="w-11 h-11 flex items-center justify-center rounded-lg transition-colors hover:bg-white/5"
            style={{ color: "var(--text-muted)" }}
          >
            <IconSearch className="w-5 h-5" />
          </Link>
          <button
            className="w-11 h-11 flex items-center justify-center rounded-lg transition-colors hover:bg-white/5"
            style={{ color: "var(--text-muted)" }}
            aria-label={t("menu")}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav
          className="lg:hidden border-t flex flex-col"
          style={{ borderColor: "var(--line)", background: "rgba(12,17,22,0.97)" }}
        >
          {contentLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={close}
              className="px-6 py-4 text-sm border-b transition-colors hover:bg-white/5"
              style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
            >
              {label}
            </Link>
          ))}
          <div className="px-6 py-4 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.02)" }}>
            <LanguageSwitcher onClick={close} />
            <AuthButton onClose={close} />
          </div>
          <div className="px-6 py-4">
            <LinkButton href="/composer" variant="primaire" onClick={close} className="w-full justify-center">
              {t("composer")}
            </LinkButton>
          </div>
        </nav>
      )}
    </header>
  );
}
