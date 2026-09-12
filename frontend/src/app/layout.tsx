import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import Link from "next/link";
import NavHeader from "@/components/NavHeader";
import Providers from "@/components/Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-fraunces",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://frontend-two-plum-92.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Riviera Secrète — Les spots confidentiels de la Côte d'Azur",
    template: "%s — Riviera Secrète",
  },
  description:
    "27 lieux hors des sentiers battus sur la Côte d'Azur, de Menton à Saint-Tropez.",
  openGraph: {
    siteName: "Riviera Secrète",
    locale: "fr_FR",
    type: "website",
  },
};

// Plausible analytics — même domaine que le site statique
const plausibleScript = "https://plausible.io/js/pa-R_6LcENgDIgoUpT8QUE4g.js";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.className} ${fraunces.variable}`}>
      <head>
        <script async src={plausibleScript} />
      </head>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <NavHeader />

          <main className="flex-1">{children}</main>

          <footer
            className="border-t mt-auto py-8 text-center text-sm"
            style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
          >
            <div className="max-w-6xl mx-auto px-6">
              <p>Riviera Secrète — Côte d&apos;Azur hors des sentiers battus</p>
              <p className="mt-1">
                Photos :{" "}
                <Link href="/credits" className="hover:text-white transition-colors">
                  crédits &amp; licences
                </Link>
              </p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
