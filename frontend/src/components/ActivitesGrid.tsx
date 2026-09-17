"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Lieu } from "@/lib/types";
import { loc, normalizeSearch, prixAffiche } from "@/lib/utils";
import {
  CATEGORIES_ACTIVITE,
  cleLienType,
  communeActivite,
  relActivite,
  enrichirActivites,
  type ActiviteEnrichie,
  type CategorieActivite,
  type TrancheDuree,
} from "@/lib/activites-data";
import FilterSelect from "@/components/FilterSelect";
import Photo from "@/components/Photo";

const TRANCHES: TrancheDuree[] = ["court", "moyen", "long", "journee"];

/** Le jour ne change pas pendant une visite : rien à écouter. */
const neJamaisResouscrire = () => () => {};
const jourClient = () => new Date().getDay();
/** Côté serveur : aucun jour connu, donc le filtre « ouvert » ne masque rien. */
const jourServeur = () => null;

export default function ActivitesGrid({ lieux }: { lieux: Lieu[] }) {
  const locale = useLocale();
  const t = useTranslations("activites");
  const tCat = useTranslations("categoriesActivite");
  const tTranche = useTranslations("tranchesDuree");
  const tRegion = useTranslations("regionFull");

  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState("");
  const [tranche, setTranche] = useState("");
  const [region, setRegion] = useState("");
  const [tarif, setTarif] = useState("");
  const [masquerFermees, setMasquerFermees] = useState(false);

  // Le jour du visiteur, pas celui du serveur : la page est en ISR, un `getDay()` rendu au
  // build serait figé dans le HTML mis en cache (même raison que FermeAujourdhui).
  const jour = useSyncExternalStore(neJamaisResouscrire, jourClient, jourServeur);

  const activites = useMemo(() => enrichirActivites(lieux), [lieux]);

  const regions = useMemo(() => {
    const vues = new Map<string, string>();
    lieux.forEach((l) => vues.set(l.regionSlug, l.regionLabel));
    return Array.from(vues.keys());
  }, [lieux]);

  const filtrees = useMemo(() => {
    const q = normalizeSearch(recherche);
    return activites.filter((a) => {
      if (q && !a.recherche.includes(q)) return false;
      if (categorie && a.categorie !== categorie) return false;
      if (tranche && a.tranche !== tranche) return false;
      if (region && a.lieu.regionSlug !== region) return false;
      if (tarif === "gratuit" && !a.gratuite) return false;
      if (tarif === "payant" && a.gratuite) return false;
      // Ne masque que ce qu'on sait fermé. Seules 10 activités sur 208 déclarent leurs jours
      // de fermeture : filtrer sur « ouvert aujourd'hui » cacherait les 198 autres, dont on
      // ignore l'horaire — ce serait affirmer une fermeture qu'on ne connaît pas.
      if (masquerFermees && jour !== null && a.fermeJours.includes(jour)) return false;
      return true;
    });
  }, [activites, recherche, categorie, tranche, region, tarif, masquerFermees, jour]);

  const nbFiltres =
    (recherche ? 1 : 0) + (categorie ? 1 : 0) + (tranche ? 1 : 0) + (region ? 1 : 0) +
    (tarif ? 1 : 0) + (masquerFermees ? 1 : 0);

  function toutEffacer() {
    setRecherche(""); setCategorie(""); setTranche(""); setRegion(""); setTarif("");
    setMasquerFermees(false);
  }

  const nbFermeesAujourdhui =
    jour === null ? 0 : activites.filter((a) => a.fermeJours.includes(jour)).length;

  return (
    <div>
      <div className="flex flex-col gap-3 mb-6">
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder={t("rechercherPlaceholder")}
          aria-label={t("rechercherLabel")}
          className="focus-ring w-full h-11 rounded-full border px-4 text-sm"
          style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text)" }}
        />

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <FilterSelect
            label={t("filtreCategorie")}
            placeholder={t("toutesCategories")}
            value={categorie}
            onChange={setCategorie}
            options={CATEGORIES_ACTIVITE.map((c) => ({
              value: c.slug,
              label: `${c.emoji} ${tCat(c.slug)}`,
            }))}
          />
          <FilterSelect
            label={t("filtreDuree")}
            placeholder={t("toutesDurees")}
            value={tranche}
            onChange={setTranche}
            options={TRANCHES.map((slug) => ({ value: slug, label: tTranche(slug) }))}
          />
          <FilterSelect
            label={t("filtreZone")}
            placeholder={t("toutesZones")}
            value={region}
            onChange={setRegion}
            options={regions.map((slug) => ({ value: slug, label: tRegion(slug) }))}
          />
          <FilterSelect
            label={t("filtreTarif")}
            placeholder={t("tousTarifs")}
            value={tarif}
            onChange={setTarif}
            options={[
              { value: "gratuit", label: t("gratuit") },
              { value: "payant", label: t("payant") },
            ]}
          />

          {/* Proposé seulement s'il y a réellement quelque chose à masquer aujourd'hui :
              une case qui ne change jamais rien ferait croire à un filtre cassé. */}
          {nbFermeesAujourdhui > 0 && (
            <label
              className="flex items-center gap-2 h-10 px-4 rounded-full border text-xs font-medium cursor-pointer transition-colors col-span-2 sm:col-span-1"
              style={{
                borderColor: masquerFermees ? "var(--terracotta)" : "var(--line)",
                background: masquerFermees ? "rgba(232,163,61,0.12)" : "var(--surface)",
                color: masquerFermees ? "var(--terracotta)" : "var(--text-muted)",
              }}
            >
              <input
                type="checkbox"
                checked={masquerFermees}
                onChange={(e) => setMasquerFermees(e.target.checked)}
                className="focus-ring accent-current"
              />
              {t("masquerFermees")}
            </label>
          )}
        </div>

        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {t("resultats", { count: filtrees.length, total: activites.length })}
          {nbFiltres > 0 && (
            <>
              {" · "}
              <button onClick={toutEffacer} className="underline focus-ring rounded" style={{ color: "var(--azure)" }}>
                {t("toutEffacer")}
              </button>
            </>
          )}
        </p>
      </div>

      {filtrees.length === 0 ? (
        <div className="text-center py-16 rounded-xl" style={{ background: "var(--surface)" }}>
          <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>{t("aucunResultat")}</p>
          <button onClick={toutEffacer} className="text-sm underline focus-ring rounded" style={{ color: "var(--azure)" }}>
            {t("toutAfficher")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtrees.map((a) => (
            <CarteActivite key={`${a.lieu.slug}-${a.activite.id}`} item={a} jour={jour} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}

function CarteActivite({
  item,
  jour,
  locale,
}: {
  item: ActiviteEnrichie;
  jour: number | null;
  locale: string;
}) {
  const t = useTranslations("activites");
  const tCat = useTranslations("categoriesActivite");
  const tActivite = useTranslations("activite");
  const { activite, lieu } = item;
  const fermee = jour !== null && item.fermeJours.includes(jour);
  const cat = CATEGORIES_ACTIVITE.find((c) => c.slug === item.categorie)!;
  const commune = communeActivite(activite, lieu);

  return (
    <article className="rounded-xl overflow-hidden flex flex-col" style={{ background: "var(--surface)" }}>
      {activite.image && (
        <Photo sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          src={activite.image}
          alt={loc(locale, activite.altEn, activite.alt)}
          className="w-full h-32 object-cover"
        />
      )}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-snug">{loc(locale, activite.nomEn, activite.nom)}</h3>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 font-semibold"
            style={
              item.gratuite
                ? { background: "rgba(79,195,201,0.15)", color: "var(--azure)" }
                : { background: "var(--surface-hover)", color: "var(--text-muted)" }
            }
          >
            {item.gratuite ? t("gratuit") : prixAffiche(locale, activite.prixEn, activite.prix)}
          </span>
        </div>

        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {cat.emoji} {tCat(item.categorie)}
          {activite.duree && <> · ⏱ {loc(locale, activite.dureeEn, activite.duree)}</>}
        </p>

        {activite.horaires && (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            🕒 {loc(locale, activite.horairesEn, activite.horaires)}
          </p>
        )}

        {fermee && (
          <span
            className="self-start text-[11px] font-semibold rounded-full px-2 py-0.5"
            style={{ background: "rgba(232,74,74,0.15)", color: "#E8705A" }}
          >
            {t("fermeAujourdhui")}
          </span>
        )}

        <div className="mt-auto pt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <Link href={`/lieux/${lieu.slug}`} className="underline focus-ring rounded" style={{ color: "var(--azure)" }}>
            {loc(locale, lieu.nomEn, lieu.nom)}
          </Link>
          {/* « à proximité de X » seulement quand l'activité ne se pratique pas au lieu
              même (Lot 3, DC-02) — sinon le nom de la commune porteuse suffit. */}
          <span style={{ color: "var(--text-muted)" }}>
            {commune ? tActivite("aProximiteDe", { commune }) : lieu.commune}
          </span>
          {activite.url && (
            <a
              href={activite.url}
              target="_blank"
              rel={relActivite(activite.partenaire)}
              className="ml-auto underline focus-ring rounded"
              style={{ color: "var(--terracotta)" }}
            >
              {tActivite(cleLienType(activite.lienType))}
              {activite.partenaire && (
                <span className="ml-1 no-underline" style={{ color: "var(--text-muted)" }}>
                  · {tActivite("lienPartenaire")}
                </span>
              )}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
