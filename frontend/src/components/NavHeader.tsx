"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

const CONTENT_LINKS = [
  { href: "/lieux", label: "Lieux" },
  { href: "/villes", label: "Villes" },
  { href: "/itineraires", label: "Itinéraires" },
];

const ACCOUNT_LINKS = [
  { href: "/creer-itineraire", label: "Créer un itinéraire" },
  { href: "/mes-itineraires", label: "Mes itinéraires" },
  { href: "/mes-favoris", label: "Mes favoris" },
];

const NAV_LINKS = [...CONTENT_LINKS, ...ACCOUNT_LINKS];

function AuthButton({ onClose }: { onClose?: () => void }) {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (session) {
    return (
      <button
        onClick={() => { signOut(); onClose?.(); }}
        className="text-sm transition-colors hover:text-white cursor-pointer"
        style={{ color: "var(--text-muted)" }}
      >
        {session.user?.name?.split(" ")[0] ?? "Mon compte"} · Déconnexion
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
      Connexion
    </Link>
  );
}

export default function NavHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

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

        {/* Desktop nav */}
        <nav className="hidden sm:flex gap-6 items-center text-sm" style={{ color: "var(--text-muted)" }}>
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="hover:text-white transition-colors">
              {label}
            </Link>
          ))}
          <AuthButton />
        </nav>

        {/* Hamburger button — mobile only */}
        <button
          className="sm:hidden p-2 -mr-2 rounded-lg transition-colors hover:bg-white/5"
          style={{ color: "var(--text-muted)" }}
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav
          className="sm:hidden border-t flex flex-col"
          style={{ borderColor: "var(--line)", background: "rgba(12,17,22,0.97)" }}
        >
          {CONTENT_LINKS.map(({ href, label }) => (
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
            {ACCOUNT_LINKS.map(({ href, label }) => (
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
            <div className="px-6 py-4">
              <AuthButton onClose={close} />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
