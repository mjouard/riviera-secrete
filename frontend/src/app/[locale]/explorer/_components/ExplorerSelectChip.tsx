"use client";

/**
 * Select natif en forme de pilule, sur les tokens du Lot 1 (Aube/Calcaire).
 *
 * Même technique que components/FilterSelect.tsx (appearance:none + chevron dessiné,
 * colorScheme:"dark" indispensable — sans lui la liste déroulante native s'ouvre en blanc
 * sur un thème sombre) mais sur la nouvelle palette : FilterSelect reste sur --terracotta,
 * encore utilisé tel quel par ActivitesGrid, non touché dans cette passe.
 */
export default function ExplorerSelectChip({
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
    <span className="relative inline-flex">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focus-ring-aube h-11 appearance-none rounded-full border pl-4 pr-9 text-base font-medium cursor-pointer transition-colors"
        style={{
          colorScheme: "dark",
          borderColor: active ? "var(--aube)" : "var(--line)",
          background: active ? "color-mix(in srgb, var(--aube) 14%, transparent)" : "var(--nuit-haute)",
          color: active ? "var(--aube)" : "var(--brume)",
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
        style={{ color: active ? "var(--aube)" : "var(--brume)" }}
      >
        <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
