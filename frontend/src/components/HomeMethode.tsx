import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * Bloc de confiance (refonte UI Lot 4e, docs/design-refonte-2026-09-14.md § 2 "La méthode").
 * Remplace l'ancienne section "confiance" (lien nu vers /a-propos) par le tableau de
 * compteurs du spec — le lien vers /a-propos reste, en complément, pas en remplacement :
 * c'était un correctif d'audit (2026-09-13, "manquait une couche de confiance") qu'il ne faut
 * pas perdre.
 *
 * Compteurs statiques, pas calculés (spec : "champs à renseigner") — sauf "lieux vérifiés",
 * qui est `lieux.length` : le seul des quatre qu'on peut dériver sans mentir, les 3 autres
 * n'ayant pas de source de données (date de dernière passe, lieux retirés, auteur).
 */
export default async function HomeMethode({ locale, lieuxCount }: { locale: string; lieuxCount: number }) {
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="text-section mb-4" style={{ color: "var(--calcaire)" }}>{t("methodeTitre")}</h2>
      <p className="text-body mb-8" style={{ color: "var(--brume)" }}>{t("methodeTexte")}</p>

      {/* Mobile : condensé à date de vérification + auteur, sans les compteurs (spec § 3
          "Accueil mobile"). */}
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left sm:text-center">
        <div className="hidden sm:block">
          <dt className="text-meta" style={{ color: "var(--brume)" }}>{t("methodeVerifies")}</dt>
          <dd className="text-data mt-1" style={{ color: "var(--calcaire)" }}>{lieuxCount} / {lieuxCount}</dd>
        </div>
        <div>
          <dt className="text-meta" style={{ color: "var(--brume)" }}>{t("methodeDernierePasse")}</dt>
          <dd className="text-data mt-1" style={{ color: "var(--calcaire)" }}>{t("methodeDernierePasseValeur")}</dd>
        </div>
        <div className="hidden sm:block">
          <dt className="text-meta" style={{ color: "var(--brume)" }}>{t("methodeRetires")}</dt>
          <dd className="text-data mt-1" style={{ color: "var(--calcaire)" }}>3</dd>
        </div>
        <div>
          <dt className="text-meta" style={{ color: "var(--brume)" }}>{t("methodeAuteur")}</dt>
          <dd className="text-data mt-1" style={{ color: "var(--calcaire)" }}>{t("methodeAuteurValeur")}</dd>
        </div>
      </dl>

      <Link
        href="/a-propos"
        className="inline-block mt-8 text-sm underline underline-offset-2"
        style={{ color: "var(--aube)" }}
      >
        {t("confianceCta")}
      </Link>
    </div>
  );
}
