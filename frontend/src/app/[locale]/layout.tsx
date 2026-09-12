import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { hasLocale } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import NavHeader from "@/components/NavHeader";
import Providers from "@/components/Providers";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-fraunces",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://frontend-two-plum-92.vercel.app";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("title"),
      template: t("titleTemplate"),
    },
    description: t("description"),
    openGraph: {
      siteName: "Riviera Secrète",
      locale: locale === "en" ? "en_US" : "fr_FR",
      type: "website",
    },
    // Pas de `alternates.languages` ici : ce layout racine s'applique à toutes les pages,
    // et un hreflang générique pointant "/" <-> "/en" serait faux sur toute page qui n'est
    // pas la homepage (chaque page devra déclarer son propre alternate au fil de la phase 1+,
    // voir .claude/memory/project_version_anglaise.md).
    // La traduction du contenu éditorial n'a pas encore démarré (voir
    // .claude/memory/project_version_anglaise.md, phase 1+) : les pages /en/* existent déjà
    // techniquement mais affichent pour l'instant le contenu français en attendant leur
    // traduction. Pas d'indexation tant que le contenu réel n'y est pas — à retirer une fois
    // la phase 1 (MVP anglais) livrée.
    robots: locale === "en" ? { index: false, follow: true } : undefined,
  };
}

// Plausible analytics — même domaine que le site statique
const plausibleScript = "https://plausible.io/js/pa-R_6LcENgDIgoUpT8QUE4g.js";

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("footer");

  return (
    <html lang={locale} className={`${inter.className} ${fraunces.variable}`}>
      <head>
        <script async src={plausibleScript} />
      </head>
      <body className="min-h-screen flex flex-col">
        <NextIntlClientProvider>
          <Providers>
            <NavHeader />

            <main className="flex-1">{children}</main>

            <footer
              className="border-t mt-auto py-8 text-center text-sm"
              style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
            >
              <div className="max-w-6xl mx-auto px-6">
                <p>{t("tagline")}</p>
                <p className="mt-1">
                  {t("photos")}{" "}
                  <Link href="/credits" className="hover:text-white transition-colors">
                    {t("credits")}
                  </Link>
                </p>
              </div>
            </footer>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
