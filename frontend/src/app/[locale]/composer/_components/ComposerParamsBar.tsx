"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Ville } from "@/lib/types";
import { loc } from "@/lib/utils";
import { DUREE_META, type DureeKey, type TransportMode } from "@/lib/itineraire-logic";
import { Chip } from "@/components/ui/Chip";
import { Field, SelectField } from "@/components/ui/Field";

/**
 * Bandeau de 4 paramètres du Composer (ROADMAP Lot 4c) — grille 4 colonnes : DURÉE /
 * DÉPART + heure / DATE / TRANSPORT. Les trois derniers manquaient entièrement à
 * /creer-itineraire (toujours "aujourd'hui, 09:00, voiture, sans point de départ" en dur) —
 * ce bandeau est ce qui les rend réglables, et c'est ce qui rend honnête l'alerte "Fermé
 * {jour}" affichée plus bas sur les vignettes : elle porte sur la date choisie ici, jamais
 * sur `new Date()`.
 */
export default function ComposerParamsBar({
  dureeKey,
  onDureeChange,
  villes,
  departSlug,
  onDepartChange,
  heure,
  onHeureChange,
  date,
  onDateChange,
  dateMin,
  mode,
  onModeChange,
}: {
  dureeKey: DureeKey;
  onDureeChange: (k: DureeKey) => void;
  villes: Ville[];
  departSlug: string;
  onDepartChange: (slug: string) => void;
  heure: string;
  onHeureChange: (v: string) => void;
  date: string;
  onDateChange: (v: string) => void;
  /** Aujourd'hui, au format ISO local — on ne compose pas un voyage dans le passé. */
  dateMin: string;
  mode: TransportMode;
  onModeChange: (m: TransportMode) => void;
}) {
  const locale = useLocale();
  const t = useTranslations("composer");
  const tDuree = useTranslations("dureeLabels");

  return (
    <div
      className="rounded-xl p-4 mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      style={{ background: "var(--nuit-haute)", boxShadow: "var(--shadow-float)" }}
    >
      {/* Durée */}
      <div>
        <p className="text-meta mb-2" style={{ color: "var(--brume)" }}>{t("champDuree")}</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(DUREE_META) as DureeKey[]).map((key) => (
            <Chip key={key} selected={dureeKey === key} onClick={() => onDureeChange(key)}>
              {tDuree(key)}
            </Chip>
          ))}
        </div>
      </div>

      {/* Départ + heure */}
      <div>
        <p className="text-meta mb-2" style={{ color: "var(--brume)" }}>{t("champDepart")}</p>
        <div className="flex gap-2">
          <SelectField
            aria-label={t("champDepart")}
            value={departSlug}
            onChange={(e) => onDepartChange(e.target.value)}
            className="flex-1 min-w-0"
          >
            <option value="">{t("departPlaceholder")}</option>
            {villes.map((v) => (
              <option key={v.slug} value={v.slug}>
                {loc(locale, v.nomEn, v.nom)}
              </option>
            ))}
          </SelectField>
          <Field
            type="time"
            aria-label={t("champHeure")}
            value={heure}
            onChange={(e) => onHeureChange(e.target.value)}
            className="w-[104px] flex-shrink-0"
          />
        </div>
      </div>

      {/* Date */}
      <div>
        <p className="text-meta mb-2" style={{ color: "var(--brume)" }}>{t("champDate")}</p>
        <Field
          type="date"
          aria-label={t("champDate")}
          value={date}
          min={dateMin}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>

      {/* Transport */}
      <div>
        <p className="text-meta mb-2" style={{ color: "var(--brume)" }}>{t("champTransport")}</p>
        <div className="flex flex-wrap gap-2">
          <Chip selected={mode === "voiture"} onClick={() => onModeChange("voiture")}>
            🚗 {t("transportVoiture")}
          </Chip>
          <Chip selected={mode === "transport-commun"} onClick={() => onModeChange("transport-commun")}>
            🚆 {t("transportCommun")}
          </Chip>
        </div>
      </div>
    </div>
  );
}
