import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5171";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.id_token) {
        try {
          const res = await fetch(`${API_URL}/api/auth/google-signin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: account.id_token }),
          });
          if (res.ok) {
            const data = await res.json();
            token.apiToken = data.token;
            token.apiUser = data.user;
          }
        } catch (e) {
          console.error("google-signin exchange failed:", e);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.apiToken) session.apiToken = token.apiToken as string;
      if (token.apiUser) {
        const u = token.apiUser as { id: string; email: string; nom: string };
        session.user = { ...session.user, id: u.id, name: u.nom, email: u.email };
      }
      return session;
    },
  },
};
