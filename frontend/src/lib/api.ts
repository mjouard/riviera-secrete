import type { Itineraire, ItineraireComposePublic, Lieu, Ville } from "./types";
import { decodeEntities } from "./utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5171";

/** Décode récursivement les entités HTML restées littérales dans les chaînes de la réponse (ex. "&amp;" → "&"). */
function decodeDeep<T>(value: T): T {
  if (typeof value === "string") return decodeEntities(value) as T;
  if (Array.isArray(value)) return value.map(decodeDeep) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = decodeDeep(v);
    return out as T;
  }
  return value;
}

/**
 * Étiquettes de cache, une par type de contenu.
 *
 * Elles permettent d'invalider *toutes* les pages qui dépendent d'un type en un appel
 * (`revalidateTag`), sans avoir à énumérer les chemins concernés. C'est indispensable ici :
 * un lieu apparaît sur sa fiche, mais aussi sur l'accueil, sur sa ville, sur `/activites`
 * et dans les itinéraires qui le citent — en deux langues. Énumérer ces chemins à la main
 * serait un inventaire à tenir à jour, donc un inventaire qui finirait faux.
 */
export const TAGS = {
  lieux: "lieux",
  villes: "villes",
  itineraires: "itineraires",
} as const;

export type TagContenu = (typeof TAGS)[keyof typeof TAGS];

async function get<T>(path: string, tag: TagContenu): Promise<T> {
  // `revalidate: 3600` reste le filet : si l'invalidation à la demande n'est pas configurée
  // (secret absent), le contenu se rafraîchit toujours, simplement au bout d'une heure.
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 3600, tags: [tag] } });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return decodeDeep((await res.json()) as T);
}

/** Fetch avec token JWT — à utiliser côté client uniquement. */
export async function authFetch(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
}

export const api = {
  lieux: {
    list: () => get<Lieu[]>("/api/lieux", TAGS.lieux),
    bySlug: (slug: string) => get<Lieu>(`/api/lieux/${slug}`, TAGS.lieux),
  },
  villes: {
    list: () => get<Ville[]>("/api/villes", TAGS.villes),
    bySlug: (slug: string) => get<Ville>(`/api/villes/${slug}`, TAGS.villes),
  },
  itineraires: {
    list: () => get<Itineraire[]>("/api/itineraires", TAGS.itineraires),
    bySlug: (slug: string) => get<Itineraire>(`/api/itineraires/${slug}`, TAGS.itineraires),
  },
  /**
   * Itinéraires composés sans compte (`/i/[id]`, lot 4d). Pas de `TAGS`/ISR ici, à la
   * différence du contenu éditorial ci-dessus : c'est du contenu utilisateur qui peut changer
   * à tout moment via PATCH/DELETE (édité via l'EditToken, sans passer par une invalidation de
   * cache côté backend) — `cache: "no-store"` pour toujours lire l'état courant.
   */
  itinerairesComposes: {
    bySlug: async (id: string): Promise<ItineraireComposePublic | null> => {
      const res = await fetch(`${API_URL}/api/itineraires-composes/${id}`, { cache: "no-store" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`API /api/itineraires-composes/${id} → ${res.status}`);
      return decodeDeep((await res.json()) as ItineraireComposePublic);
    },
    /**
     * Crée un itinéraire composé (Lot 4d, brique "brancher la création" — jusqu'ici aucun
     * bouton du site n'appelait jamais cet endpoint, pourtant complet côté backend : `/i/[id]`
     * était inatteignable par un vrai visiteur). Fonctionne sans compte ; `token`, s'il est
     * fourni, rattache l'itinéraire au compte connecté en plus de l'`EditToken` (le backend
     * autorise alors PATCH/DELETE par les deux voies).
     */
    create: async (
      payload: { nom: string; dureeKey: string; jours: string[][] },
      token?: string
    ): Promise<{ id: string; editToken: string }> => {
      const res = await fetch(`${API_URL}/api/itineraires-composes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`POST /api/itineraires-composes → ${res.status}`);
      return res.json();
    },
    /** PATCH avec l'EditToken — remet à jour un lien déjà créé plutôt que d'en créer un
     * second à chaque nouveau clic sur "Partager" pendant la même édition. */
    update: async (
      id: string,
      payload: { nom: string; dureeKey: string; jours: string[][] },
      editToken: string
    ): Promise<void> => {
      const res = await fetch(`${API_URL}/api/itineraires-composes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Edit-Token": editToken },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`PATCH /api/itineraires-composes/${id} → ${res.status}`);
    },
    /** DELETE avec l'EditToken — Lot 4d, brique "modale de suppression". */
    remove: async (id: string, editToken: string): Promise<void> => {
      const res = await fetch(`${API_URL}/api/itineraires-composes/${id}`, {
        method: "DELETE",
        headers: { "X-Edit-Token": editToken },
      });
      if (!res.ok) throw new Error(`DELETE /api/itineraires-composes/${id} → ${res.status}`);
    },
  },
};
