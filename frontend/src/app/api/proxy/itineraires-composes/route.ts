import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api-production-19623.up.railway.app";

/**
 * Création d'un itinéraire composé (anonyme ou lié à un compte).
 *
 * Endpoint public côté backend — pas de session requise — mais si un JWT est présent dans le
 * cookie NextAuth, on l'ajoute pour rattacher l'itinéraire au compte de l'utilisateur.
 * Évite d'exposer le token côté client, tout en conservant le comportement de liaison.
 */
export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const apiToken = (token?.apiToken as string | undefined) ?? null;

  const body = await request.text();
  const res = await fetch(`${API_URL}/api/itineraires-composes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
    },
    body,
  });
  return new Response(res.body, { status: res.status });
}
