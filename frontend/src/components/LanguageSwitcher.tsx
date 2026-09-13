"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export default function LanguageSwitcher({ onClick }: { onClick?: () => void }) {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 text-sm" style={{ color: "var(--text-muted)" }}>
      <Link
        href={pathname}
        locale="fr"
        onClick={onClick}
        className="transition-colors hover:text-white"
        style={locale === "fr" ? { color: "var(--text)", fontWeight: 600 } : undefined}
        aria-current={locale === "fr" ? "true" : undefined}
      >
        FR
      </Link>
      <span aria-hidden="true">/</span>
      <Link
        href={pathname}
        locale="en"
        onClick={onClick}
        className="transition-colors hover:text-white"
        style={locale === "en" ? { color: "var(--text)", fontWeight: 600 } : undefined}
        aria-current={locale === "en" ? "true" : undefined}
      >
        EN
      </Link>
    </div>
  );
}
