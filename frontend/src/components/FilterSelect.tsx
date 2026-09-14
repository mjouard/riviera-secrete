"use client";

/**
 * Sélecteur de filtre du site — pastille arrondie, chevron dessiné, état actif en terracotta.
 *
 * `appearance: none` retire le chrome natif, et `colorScheme: "dark"` reste indispensable :
 * sans lui, le menu déroulant que le système ouvre par-dessus s'affiche en blanc sur un site
 * sombre. C'était le vrai motif du « c'est moche sur mobile » — le contrôle fermé allait
 * bien, c'est la liste ouverte qui jurait.
 *
 * Partagé entre la grille des lieux et celle des activités : deux copies auraient divergé.
 */
export default function FilterSelect({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  const active = value !== "";
  return (
    <span className="relative inline-flex w-full sm:w-auto">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focus-ring w-full h-10 appearance-none rounded-full border pl-4 pr-9 text-xs font-medium cursor-pointer transition-colors sm:w-auto"
        style={{
          colorScheme: "dark",
          borderColor: active ? "var(--terracotta)" : "var(--line)",
          background: active ? "rgba(232,163,61,0.12)" : "var(--surface)",
          color: active ? "var(--terracotta)" : "var(--text-muted)",
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 12 12"
        className="pointer-events-none absolute right-3.5 top-1/2 h-3 w-3 -translate-y-1/2"
        style={{ color: active ? "var(--terracotta)" : "var(--text-muted)" }}
      >
        <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
