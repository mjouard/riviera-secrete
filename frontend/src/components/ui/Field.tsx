import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

/**
 * Refonte UI Lot 1 — champs de saisie (docs/design-refonte-2026-09-14.md § 1).
 * 44px min-height, 16px de police plancher absolu : sous 16px, Safari iOS zoome à la mise au
 * point du champ et ne dézoome pas (MO-02). Aucun champ existant n'est retouché dans cette
 * passe — seuls les nouveaux usages passent par ici.
 */
const FIELD_STYLE = {
  minHeight: "44px",
  fontSize: "16px",
  borderRadius: "var(--radius)",
  background: "var(--nuit-haute)",
  color: "var(--calcaire)",
  border: "1px solid var(--line)",
  paddingInline: "12px",
};

export function Field({ className = "", style, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`focus-ring-aube w-full ${className}`} style={{ ...FIELD_STYLE, ...style }} {...props} />;
}

export function SelectField({ className = "", style, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  // colorScheme: dark — sans ça, la liste déroulante native du <select> s'ouvre en blanc sur
  // mobile, incohérente avec le thème sombre du site (raison documentée dans FilterSelect.tsx).
  return (
    <select
      className={`focus-ring-aube w-full ${className}`}
      style={{ ...FIELD_STYLE, colorScheme: "dark", ...style }}
      {...props}
    />
  );
}

export function TextareaField({ className = "", style, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`focus-ring-aube w-full ${className}`} style={{ ...FIELD_STYLE, ...style }} {...props} />;
}
