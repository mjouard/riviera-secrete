import type { Itineraire, Lieu } from "@/lib/types";
import ComposeCard from "./ComposeCard";

/**
 * "Déjà composés" (refonte UI Lot 4e) — grille verticale 3:2 en desktop, scroll horizontal
 * en mobile (spec § 3 : "1 carte visible, scroll horizontal, pas de grille"). Même technique
 * `.hscroll`/`snap-x`/largeur-fixe-puis-`sm:w-auto` que les autres rangées secondaires du
 * site (booking cards, activités d'une fiche lieu — voir lieux/[slug]/page.tsx).
 * Server Component : ComposeCard ne dépend d'aucun état client.
 */
export default function HomeItineraires({
  itineraires,
  lieuBySlug,
}: {
  itineraires: Itineraire[];
  lieuBySlug: Map<string, Lieu>;
}) {
  return (
    <div className="hscroll flex gap-4 overflow-x-auto -mx-6 px-6 pb-2 snap-x snap-mandatory sm:grid sm:gap-6 sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible sm:grid-cols-2 lg:grid-cols-3">
      {itineraires.map((itin) => (
        <div key={itin.id} className="flex-shrink-0 snap-start w-[88%] sm:w-auto">
          <ComposeCard itin={itin} lieuBySlug={lieuBySlug} />
        </div>
      ))}
    </div>
  );
}
