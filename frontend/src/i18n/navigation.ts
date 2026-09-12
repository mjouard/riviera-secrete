import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Remplace next/link et next/navigation dans tout le code applicatif : ces versions
 * connaissent la locale courante et préfixent automatiquement les liens internes
 * (ex. sur /en/villes, <Link href="/villes"> pointe vers /en/villes, pas /villes).
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
