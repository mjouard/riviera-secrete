import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api-production-19623.up.railway.app";

async function bearerToken(req: NextRequest): Promise<string | null> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  return (token?.apiToken as string | undefined) ?? null;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await bearerToken(request);
  if (!token) return Response.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const body = await request.text();
  const res = await fetch(`${API_URL}/api/my-itineraires/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body,
  });
  return new Response(res.body, { status: res.status });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await bearerToken(request);
  if (!token) return Response.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const res = await fetch(`${API_URL}/api/my-itineraires/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return new Response(res.body, { status: res.status });
}
