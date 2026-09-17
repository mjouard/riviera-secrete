"use client";

import { useState } from "react";
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
 *
 * Sur mobile (→ audit UX 17/09, 1.3), replié par défaut en une ligne récap éditable
 * (« Journée · Nice · 9 h · Voiture · Modifier ») plutôt que les 4 champs à plat : c'était,
 * avec les filtres d'ComposerPicker.tsx, la moitié du "mur de réglages" qui repoussait le
 * premier lieu à 1 342px. Toujours développé sur desktop (`lg:`), où ce n'était pas signalé.
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
  const [deplie, setDeplie] = useState(false);

  const departVille = villes.find((v) => v.slug === departSlug);
  const recap = [
    tDuree(dureeKey),
    departVille ? loc(locale, departVille.nomEn, departVille.nom) : null,
    heure,
    mode === "voiture" ? t("transportVoiture") : t("transportCommun"),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className="rounded-xl p-4 mb-6"
      style={{ background: "var(--nuit-haute)", boxShadow: "var(--shadow-float)" }}
    >
      {!deplie && (
        <button
          type="button"
          onClick={() => setDeplie(true)}
          className="focus-ring-aube lg:hidden w-full flex items-center justify-between gap-3 text-left"
        >
          <span className="text-body truncate" style={{ color: "var(--calcaire)" }}>{recap}</span>
          <span className="text-body font-semibold flex-shrink-0" style={{ color: "var(--azure)" }}>{t("modifier")}</span>
        </button>
      )}

      <div className={`${deplie ? "grid" : "hidden"} lg:grid gap-4 sm:grid-cols-2 lg:grid-cols-4`}>
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

      {deplie && (
        <button
          type="button"
          onClick={() => setDeplie(false)}
          className="focus-ring-aube lg:hidden mt-4 text-body font-semibold"
          style={{ color: "var(--azure)" }}
        >
          {t("terminer")}
        </button>
      )}
    </div>
  );
}
