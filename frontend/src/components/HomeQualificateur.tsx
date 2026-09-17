"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { Ville } from "@/lib/types";
import { distanceKm, loc } from "@/lib/utils";
import { DUREE_META, type DureeKey } from "@/lib/itineraire-logic";
import { Chip } from "@/components/ui/Chip";
import { SelectField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const DUREE_KEYS = Object.keys(DUREE_META) as DureeKey[];

/** Mappe le contrôle « J'ai envie de » du spec sur les badges réels — pas de badge "visiter"
 * dans BADGE_DEFS, donc ce choix n'ajoute aucun filtre (tous les lieux restent éligibles). */
const ENVIES = [
  { key: "marcher", badge: "randonnee" },
  { key: "visiter", badge: "" },
  { key: "seBaigner", badge: "plage" },
  { key: "manger", badge: "restaurant" },
] as const;

/**
 * Héros qualificateur (refonte UI Lot 4e, remplace le carrousel vitrine) : 3 questions →
 * lien direct vers /composer pré-rempli. /composer lit déjà duree/depart/badge depuis l'URL
 * au montage (voir ComposerPage), donc ce composant n'a besoin d'écrire que ces 3 paramètres.
 */
export default function HomeQualificateur({ villes, lieuxCount }: { villes: Ville[]; lieuxCount: number }) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("home");
  const tDuree = useTranslations("dureeLabels");

  const [dureeKey, setDureeKey] = useState<DureeKey>("journee");
  const [departSlug, setDepartSlug] = useState(villes.find((v) => v.slug === "nice")?.slug ?? villes[0]?.slug ?? "");
  const [envieKey, setEnvieKey] = useState<string>("");
  const [geoEtat, setGeoEtat] = useState<"idle" | "chargement" | "refuse" | "indisponible">("idle");

  function utiliserMaPosition() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoEtat("indisponible");
      return;
    }
    setGeoEtat("chargement");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const plusProche = villes.reduce((meilleure, v) => {
          const d = distanceKm(pos.coords.latitude, pos.coords.longitude, v.lat, v.lng);
          const dMeilleure = distanceKm(pos.coords.latitude, pos.coords.longitude, meilleure.lat, meilleure.lng);
          return d < dMeilleure ? v : meilleure;
        }, villes[0]);
        if (plusProche) setDepartSlug(plusProche.slug);
        setGeoEtat("idle");
      },
      (err) => setGeoEtat(err.code === err.PERMISSION_DENIED ? "refuse" : "indisponible"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  }

  function composer() {
    const params = new URLSearchParams();
    params.set("duree", dureeKey);
    if (departSlug) params.set("depart", departSlug);
    const envie = ENVIES.find((e) => e.key === envieKey);
    if (envie?.badge) params.set("badge", envie.badge);
    router.push(`/composer?${params.toString()}`);
  }

  return (
    <div className="relative z-[2] max-w-xl mx-auto" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.65)" }}>
      <h1 className="text-[32px] leading-tight sm:text-display mb-3 sm:mb-4" style={{ color: "var(--calcaire)" }}>
        {t("qualifTitre")}
      </h1>
      <p className="text-body mb-5 sm:mb-8" style={{ color: "var(--brume)" }}>
        {t("qualifSousTitre")}
      </p>

      <div
        className="text-left rounded-2xl p-5 sm:p-6 flex flex-col gap-5"
        style={{ background: "var(--nuit-haute)", border: "1px solid var(--line)" }}
      >
        <div>
          <p className="text-meta mb-2" style={{ color: "var(--brume)" }}>{t("qualifJAi")}</p>
          <div className="flex flex-wrap gap-2">
            {DUREE_KEYS.map((k) => (
              <Chip key={k} selected={dureeKey === k} onClick={() => setDureeKey(k)}>
                {tDuree(k)}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="text-meta mb-2" style={{ color: "var(--brume)" }}>{t("qualifJeParsDe")}</p>
          <div className="flex flex-wrap gap-2 items-center">
            <SelectField
              className="!w-auto"
              value={departSlug}
              onChange={(e) => setDepartSlug(e.target.value)}
              aria-label={t("qualifJeParsDe")}
            >
              {villes.map((v) => (
                <option key={v.slug} value={v.slug}>
                  {loc(locale, v.nomEn, v.nom)}
                </option>
              ))}
            </SelectField>
            <Button type="button" variant="discret" onClick={utiliserMaPosition} disabled={geoEtat === "chargement"}>
              {geoEtat === "chargement" ? t("localisationEnCours") : t("qualifMaPosition")}
            </Button>
          </div>
          {(geoEtat === "refuse" || geoEtat === "indisponible") && (
            <p className="text-meta mt-2" style={{ color: "var(--aube)" }}>
              {geoEtat === "refuse" ? t("localisationRefusee") : t("localisationIndisponible")}
            </p>
          )}
        </div>

        {/* Masqué sur mobile (audit UX 17/09, 5.1) : sur un écran de 812px, ces 3 questions
            repoussaient le bouton "Composer" hors du premier écran. La question reste posable
            via les mêmes badges sur /composer (ComposerPicker), rien n'est perdu — juste
            reporté à "l'étape suivante" comme le préconise le correctif. */}
        <div className="hidden sm:block">
          <p className="text-meta mb-2" style={{ color: "var(--brume)" }}>{t("qualifJAiEnvie")}</p>
          <div className="flex flex-wrap gap-2">
            {ENVIES.map((e) => (
              <Chip key={e.key} selected={envieKey === e.key} onClick={() => setEnvieKey(envieKey === e.key ? "" : e.key)}>
                {t(`qualifEnvie_${e.key}` as "qualifEnvie_marcher")}
              </Chip>
            ))}
          </div>
        </div>

        <Button type="button" variant="primaire" onClick={composer} className="w-full sm:w-auto self-start">
          {t("qualifComposerBouton")}
        </Button>
      </div>

      <a href="#explorer" className="inline-block mt-5 text-sm underline underline-offset-2" style={{ color: "var(--brume)" }}>
        {t("qualifOuExplorer", { count: lieuxCount })}
      </a>
    </div>
  );
}
