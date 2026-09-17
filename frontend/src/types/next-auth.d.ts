import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    apiToken?: string; // intermédiaire authorize() → jwt() uniquement, jamais exposé en session
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    apiToken?: string;
    apiUser?: { id: string; email: string; nom: string };
  }
}
