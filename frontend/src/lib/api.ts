import type { Itineraire, Lieu, Ville } from "./types";
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

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 3600 } });
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
    list: () => get<Lieu[]>("/api/lieux"),
    bySlug: (slug: string) => get<Lieu>(`/api/lieux/${slug}`),
  },
  villes: {
    list: () => get<Ville[]>("/api/villes"),
    bySlug: (slug: string) => get<Ville>(`/api/villes/${slug}`),
  },
  itineraires: {
    list: () => get<Itineraire[]>("/api/itineraires"),
    bySlug: (slug: string) => get<Itineraire>(`/api/itineraires/${slug}`),
  },
};
