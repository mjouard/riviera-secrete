"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSession, signOut } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";

function useNavLinks() {
  const t = useTranslations("nav");
  // « Itinéraires » pointe désormais sur sa propre page (Lot 5, 2026-09-16) plutôt que sur
  // l'ancre d'accueil #itineraires — /itineraires (index éditorial) existe depuis ce lot.
  // « Lieux » reste sur l'ancre #explorer de l'accueil (Lot 4e a remplacé la grille #lieux par
  // l'aperçu Explorer) : /explorer existe déjà en page dédiée, mais son remplacement complet
  // de ce lien fait partie de la brique "nouveau menu", pas de celle-ci.
  const contentLinks = [
    { href: "/#explorer", label: t("lieux") },
    { href: "/activites", label: t("activites") },
    { href: "/itineraires", label: t("itineraires") },
    { href: "/villes", label: t("villes") },
  ];
  const accountLinks = [
    { href: "/creer-itineraire", label: t("creerItineraire") },
    { href: "/mes-itineraires", label: t("mesItineraires") },
    { href: "/mes-favoris", label: t("mesFavoris") },
  ];
  return { contentLinks, accountLinks, navLinks: [...contentLinks, ...accountLinks] };
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

export default function NavHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const t = useTranslations("nav");
  const { contentLinks, accountLinks, navLinks } = useNavLinks();

  return (
    <header
      className="sticky top-0 z-10 border-b"
      style={{
        background: "rgba(12,17,22,0.85)",
        backdropFilter: "blur(8px)",
        borderColor: "var(--line)",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          onClick={close}
          className="font-display text-lg font-semibold tracking-tight"
          style={{ color: "var(--text)" }}
        >
          Riviera Secrète
        </Link>

        {/* Barre complète à partir de lg (1024px) et non sm (640px) : avec sept entrées,
            le sélecteur de langue et le bouton de compte, l'en-tête débordait dès 700px —
            mesuré à 822px de contenu pour 700 disponibles. En dessous, le menu déroulant. */}
        <nav className="hidden lg:flex gap-4 xl:gap-6 items-center text-sm" style={{ color: "var(--text-muted)" }}>
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} className="hover:text-white transition-colors">
              {label}
            </Link>
          ))}
          <Link
            href="/#lieu-search"
            title={t("rechercher")}
            aria-label={t("rechercher")}
            className="hover:text-white transition-colors"
          >
            <span aria-hidden="true">🔎</span>
          </Link>
          <LanguageSwitcher />
          <AuthButton />
        </nav>

        {/* Hamburger button — mobile only */}
        <button
          className="lg:hidden p-2 -mr-2 rounded-lg transition-colors hover:bg-white/5"
          style={{ color: "var(--text-muted)" }}
          aria-label={t("menu")}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav
          className="lg:hidden border-t flex flex-col"
          style={{ borderColor: "var(--line)", background: "rgba(12,17,22,0.97)" }}
        >
          <Link
            href="/#lieu-search"
            onClick={close}
            className="px-6 py-4 text-sm border-b transition-colors hover:bg-white/5"
            style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
          >
            🔎 {t("rechercher")}
          </Link>
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
          <div style={{ background: "rgba(255,255,255,0.02)" }}>
            {accountLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={close}
                className="block px-6 py-4 text-sm border-b transition-colors hover:bg-white/5"
                style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
              >
                {label}
              </Link>
            ))}
            <div className="px-6 py-4 flex items-center justify-between">
              <LanguageSwitcher onClick={close} />
              <AuthButton onClose={close} />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
