import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5171";

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/connexion",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });
        if (!res.ok) return null;

        const data = await res.json();
        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.nom,
          apiToken: data.token as string,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
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
      } else if (user?.apiToken) {
        token.apiToken = user.apiToken;
        token.apiUser = { id: user.id, email: user.email ?? "", nom: user.name ?? "" };
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
