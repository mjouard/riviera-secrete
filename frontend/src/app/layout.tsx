import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Riviera Secrète — Les spots confidentiels de la Côte d'Azur",
  description:
    "27 lieux hors des sentiers battus sur la Côte d'Azur, de Menton à Saint-Tropez.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.className}>
      <body className="min-h-screen flex flex-col">
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
              className="font-serif text-lg font-semibold tracking-tight"
              style={{ color: "var(--text)" }}
            >
              Riviera Secrète
            </Link>
            <nav className="flex gap-6 text-sm" style={{ color: "var(--text-muted)" }}>
              <Link href="/lieux" className="hover:text-white transition-colors">
                Lieux
              </Link>
              <Link
                href="/itineraires"
                className="hover:text-white transition-colors"
              >
                Itinéraires
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer
          className="border-t mt-auto py-8 text-center text-sm"
          style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
        >
          <div className="max-w-6xl mx-auto px-6">
            Riviera Secrète — Côte d&apos;Azur hors des sentiers battus
          </div>
        </footer>
      </body>
    </html>
  );
}
