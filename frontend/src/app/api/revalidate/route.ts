import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { TAGS, type TagContenu } from "@/lib/api";

/**
 * Invalidation à la demande du cache ISR, appelée après une écriture de contenu en base.
 *
 * Sans elle, une correction de contenu pouvait rester invisible des semaines : les pages
 * sont prérendues et ne se rafraîchissent qu'à la visite suivante *après* expiration du
 * délai — donc jamais, sur une page peu fréquentée. Le cas réel qui a motivé ce correctif :
 * `/en/itineraires/villages-perches` a continué de proposer à la réservation, à 6 €, un
 * château fermé au public depuis 2015, avec un lien vers un domaine viticole sans rapport,
 * alors que l'API servait déjà la bonne donnée.
 *
 * Le déclencheur est l'outil de synchronisation (`RivieraSecrete.Tools`), pas l'API : c'est
 * lui, et lui seul, qui modifie le contenu éditorial. L'API ne touche qu'aux données de
 * compte, qui ne sont jamais prérendues.
 *
 * Hors de `[locale]` : l'invalidation d'une étiquette vaut pour les deux langues à la fois.
 */
export const dynamic = "force-dynamic";

const ETIQUETTES_CONNUES = new Set<string>(Object.values(TAGS));

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;

  // Pas de secret configuré : on refuse plutôt que d'exposer une invalidation ouverte à
  // tous. `revalidate: 3600` continue d'assurer le rafraîchissement, en différé.
  if (!secret) {
    return NextResponse.json(
      { error: "REVALIDATE_SECRET non configuré côté frontend." },
      { status: 503 }
    );
  }

  if (request.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json({ error: "Secret invalide." }, { status: 401 });
  }

  let tags: unknown;
  try {
    ({ tags } = (await request.json()) as { tags?: unknown });
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  // Liste blanche : `revalidateTag` sur une étiquette arbitraire ne casserait rien, mais
  // accepter n'importe quoi masquerait une faute de frappe côté appelant, qui croirait
  // avoir invalidé alors que non.
  const demandees = Array.isArray(tags) ? tags.filter((t): t is string => typeof t === "string") : [];
  const inconnues = demandees.filter((t) => !ETIQUETTES_CONNUES.has(t));
  if (demandees.length === 0 || inconnues.length > 0) {
    return NextResponse.json(
      {
        error: "Étiquettes invalides.",
        inconnues,
        connues: [...ETIQUETTES_CONNUES],
      },
      { status: 400 }
    );
  }

  // `{ expire: 0 }` plutôt que le profil `"max"` recommandé par défaut : celui-ci sert
  // encore le contenu périmé pendant que le frais se régénère en arrière-plan. Acceptable
  // pour un catalogue produit, pas ici — on invalide justement parce qu'une information
  // était fausse, et la servir une fois de plus est exactement ce qu'on corrige.
  // `updateTag`, qui expire immédiatement, n'est utilisable que dans une Server Action.
  for (const tag of demandees) revalidateTag(tag as TagContenu, { expire: 0 });

  return NextResponse.json({ revalidees: demandees, at: new Date().toISOString() });
}
