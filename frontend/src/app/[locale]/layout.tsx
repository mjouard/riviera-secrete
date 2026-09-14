import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import { hasLocale } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { api } from "@/lib/api";
import NavHeader from "@/components/NavHeader";
import Providers from "@/components/Providers";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
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

/**
 * Toute valeur de `locale` autre que fr/en doit répondre 404 sans jamais être rendue.
 *
 * Le proxy next-intl ignore les chemins portant une extension (matcher `.*\..*`, requis
 * pour /sitemap.xml, /assets/…, /sw.js) : une URL inexistante comme /foo.txt ou
 * /apple-touch-icon.png atterrit donc ici avec locale = "foo.txt". Sans ce réglage, Next
 * tentait un rendu à la demande de cette page prérendue statiquement ; next-intl, faute de
 * `setRequestLocale` valide, lisait alors les en-têtes — interdit sur une page statique —
 * et la réponse était **500 au lieu de 404**. Un 5xx sur /robots.txt fait suspendre le
 * crawl à Google (voir aussi app/robots.ts).
 */
export const dynamicParams = false;

/**
 * `themeColor` colore la barre d'adresse mobile et l'écran de démarrage de la PWA.
 * Le site n'ayant qu'un thème sombre côté chrome, une seule valeur suffit — elle doit
 * rester alignée sur --bg (globals.css) et sur background_color/theme_color du manifest.
 */
export const viewport: Viewport = {
  themeColor: "#0C1116",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const [t, lieux] = await Promise.all([
    getTranslations({ locale, namespace: "meta" }),
    api.lieux.list().catch(() => []),
  ]);

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("title"),
      template: t("titleTemplate"),
    },
    description: t("description", { count: lieux.length }),
    openGraph: {
      siteName: "Riviera Secrète",
      locale: locale === "en" ? "en_US" : "fr_FR",
      type: "website",
    },
    // Un manifeste par langue : celui par défaut est français, /en pointe vers sa variante
    // (voir src/lib/manifest.ts). Sans ça, installer le site depuis /en donnait une
    // application au nom et à la description français.
    manifest: locale === "en" ? "/manifest.en.webmanifest" : "/manifest.webmanifest",
    // iOS ignore les icônes du manifest et lit uniquement apple-touch-icon.
    icons: { apple: "/icons/apple-touch-icon.png" },
    appleWebApp: { capable: true, title: "Riviera Secrète", statusBarStyle: "black-translucent" },
    // Pas de `alternates.languages` ici : ce layout racine s'applique à toutes les pages,
    // et un hreflang générique pointant "/" <-> "/en" serait faux sur toute page qui n'est
    // pas la homepage — chaque page déclare son propre alternate (voir generateMetadata sur
    // page.tsx, villes/page.tsx, villes/[slug]/page.tsx, lieux/[slug]/page.tsx,
    // itineraires/[slug]/page.tsx, credits/page.tsx).
    // Le `noindex` sur /en a été retiré le 2026-09-13 : le contenu éditorial (43 lieux, 34
    // villes, 6 itinéraires, 205 activités) est maintenant réellement traduit — voir
    // .claude/memory/project_version_anglaise.md. Les pages compte/outil
    // (creer-itineraire, mes-itineraires, mes-favoris, connexion, confirmer-email) restent
    // noindex indépendamment de la locale, via leur propre layout.tsx.
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
            <ServiceWorkerRegistrar />
            <NavHeader />

            <main className="flex-1">{children}</main>

            <footer
              className="border-t mt-auto py-8 text-center text-sm"
              style={{ borderColor: "var(--line)", color: "var(--text-muted)" }}
            >
              <div className="max-w-6xl mx-auto px-6">
                <p>{t("tagline")}</p>
                <p className="mt-1">
                  <Link href="/a-propos" className="hover:text-white transition-colors">
                    {t("aPropos")}
                  </Link>
                  <span className="mx-2" aria-hidden="true">·</span>
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
