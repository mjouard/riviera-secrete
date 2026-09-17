"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Itineraire, Lieu } from "@/lib/types";
import { dureeKeyDepuisBadge, type DureeKey } from "@/lib/itineraire-logic";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import ComposeCard from "@/components/ComposeCard";

const REGION_ORDER = ["menton-monaco", "nice", "arriere-pays", "antibes-cannes", "golfe-st-tropez"] as const;
const DUREE_ORDER: DureeKey[] = ["demi-journee", "journee", "2-jours", "3-jours"];

/** Zones traversées par un itinéraire, déduites de ses étapes (pas de champ dédié — un
 * itinéraire n'a pas de région propre, seulement des lieux qui en ont une). */
function zonesDeLItineraire(itin: Itineraire, lieuBySlug: Map<string, Lieu>): Set<string> {
  const zones = new Set<string>();
  for (const item of itin.items) {
    if (item.type !== "stop") continue;
    const lieu = lieuBySlug.get(item.lieuSlug);
    if (lieu) zones.add(lieu.regionSlug);
  }
  return zones;
}

/**
 * Filtres zone/durée (→ audit UX 17/09, ROADMAP § Trimestre "Filtres itinéraires prêts").
 * Le filtre "voiture/train" du correctif n'est pas fait ici : `metaPills` ne porte qu'un texte
 * libre de transport ("Marche pour le sentier, voiture pour Biot et Cagnes"...), pas un mode
 * fermé — les 6 itinéraires actuels sont d'ailleurs tous en voiture, un filtre n'y changerait
 * rien tant qu'aucun n'est vraiment accessible en train. Un vrai filtre demanderait un champ
 * structuré (JSON + entité + migration EF), pas fait dans cette passe.
 */
export default function ItinerairesShell({
  itineraires,
  lieuBySlug,
}: {
  itineraires: Itineraire[];
  lieuBySlug: Map<string, Lieu>;
}) {
  const t = useTranslations("itineraires");
  const tRegion = useTranslations("regionShort");
  const tDuree = useTranslations("dureeLabels");

  const [zone, setZone] = useState("");
  const [duree, setDuree] = useState<DureeKey | "">("");

  const enrichis = useMemo(
    () =>
      itineraires.map((itin) => ({
        itin,
        zones: zonesDeLItineraire(itin, lieuBySlug),
        dureeKey: dureeKeyDepuisBadge(itin.badge),
      })),
    [itineraires, lieuBySlug]
  );

  const zonesPresentes = useMemo(
    () => REGION_ORDER.filter((slug) => enrichis.some((e) => e.zones.has(slug))),
    [enrichis]
  );
  const dureesPresentes = useMemo(
    () => DUREE_ORDER.filter((k) => enrichis.some((e) => e.dureeKey === k)),
    [enrichis]
  );

  const filtres = enrichis.filter(
    (e) => (!zone || e.zones.has(zone)) && (!duree || e.dureeKey === duree)
  );
  const aUnFiltre = zone !== "" || duree !== "";

  return (
    <div>
      {(zonesPresentes.length > 1 || dureesPresentes.length > 1) && (
        <div className="flex flex-wrap gap-2 items-center mb-8">
          {zonesPresentes.length > 1 &&
            zonesPresentes.map((slug) => (
              <Chip key={slug} selected={zone === slug} onClick={() => setZone(zone === slug ? "" : slug)}>
                {tRegion(slug as (typeof REGION_ORDER)[number])}
              </Chip>
            ))}

          {zonesPresentes.length > 1 && dureesPresentes.length > 1 && (
            <span className="w-px self-stretch mx-1" style={{ background: "var(--line)" }} aria-hidden="true" />
          )}

          {dureesPresentes.length > 1 &&
            dureesPresentes.map((k) => (
              <Chip key={k} selected={duree === k} onClick={() => setDuree(duree === k ? "" : k)}>
                {tDuree(k)}
              </Chip>
            ))}

          {aUnFiltre && (
            <Button type="button" variant="discret" onClick={() => { setZone(""); setDuree(""); }}>
              {t("toutEffacer")}
            </Button>
          )}
        </div>
      )}

      {filtres.length === 0 ? (
        <p className="text-body py-10 text-center" style={{ color: "var(--brume)" }}>{t("aucunResultat")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtres.map(({ itin }) => (
            <ComposeCard key={itin.id} itin={itin} lieuBySlug={lieuBySlug} />
          ))}
        </div>
      )}
    </div>
  );
}
