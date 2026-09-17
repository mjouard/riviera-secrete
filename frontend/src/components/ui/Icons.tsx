/**
 * Refonte UI Lot 1 — jeu minimal d'icônes SVG inline, en remplacement des emojis d'interface
 * (🥾🏛🍽️⛵🔎📍) — voir docs/design-refonte-2026-09-14.md. Les emojis éditoriaux (data/*.json,
 * messages/*.json, BADGE_DEFS) ne sont pas concernés, seuls les nouveaux composants ui/*
 * consomment ces icônes. Grille 20×20, stroke uniquement, hérite la couleur du texte.
 */
type IconProps = {
  className?: string;
};

const BASE_PROPS = {
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconHike({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M4 17l3.5-9 2 4.5L11 9l2.5 8" />
      <circle cx="13.5" cy="4" r="1.6" />
      <path d="M13 6.5L10 11l3 1.5-1 4.5" />
    </svg>
  );
}

export function IconLandmark({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M3 8l7-4.5L17 8" />
      <path d="M4 8v8M8 8v8M12 8v8M16 8v8" />
      <path d="M3 16h14" />
      <path d="M2.5 16.5h15" />
    </svg>
  );
}

export function IconFork({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M6 3v6a2 2 0 004 0V3M6 3v3M8 3v3M10 3v3M8 9v8" />
      <path d="M15 3c-1.4 0-2.5 1.6-2.5 4.5S13.6 11.5 15 11.5V17" />
    </svg>
  );
}

export function IconSail({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M10 2v14" />
      <path d="M10 3l4.5 8H10z" />
      <path d="M10 6L6 13h4z" />
      <path d="M3 17c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0" />
    </svg>
  );
}

export function IconSearch({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="M16.5 16.5L13 13" />
    </svg>
  );
}

export function IconPin({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M10 17.5S16 12.4 16 8a6 6 0 10-12 0c0 4.4 6 9.5 6 9.5z" />
      <circle cx="10" cy="8" r="2.2" />
    </svg>
  );
}

export function IconClose({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  );
}

export function IconClock({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 5.5V10l3.2 2" />
    </svg>
  );
}

export function IconChevronDown({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M5 7.5l5 5 5-5" />
    </svg>
  );
}

/** Badge "plage" (→ audit UX 17/09, 3.3 — remplace 🏖️). */
export function IconBeach({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M2.5 17c2-1 4-1 6 0s4 1 6 0 3-1 3-1" />
      <path d="M10 12.5S6 9 6 5.5A4 4 0 0110 2c0 4-2 6-2 6" />
      <path d="M10 12.5L4 8M10 12.5l6.5-2.5" />
    </svg>
  );
}

/** Badge "VTT" (→ audit UX 17/09, 3.3 — remplace 🚵). */
export function IconBike({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <circle cx="5" cy="14.5" r="3" />
      <circle cx="15" cy="14.5" r="3" />
      <path d="M5 14.5l3.5-7h4l2.5 7" />
      <path d="M8.5 7.5h4M8.5 7.5L7 4h-1.5" />
    </svg>
  );
}

/** Badge "plongée" (→ audit UX 17/09, 3.3 — remplace 🤿). */
export function IconDiving({ className }: IconProps) {
  return (
    <svg {...BASE_PROPS} className={className} aria-hidden="true">
      <path d="M4 10a5 5 0 0110 0v3a1.5 1.5 0 001.5 1.5H16" />
      <circle cx="6.5" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="11.5" cy="10" r="1" fill="currentColor" stroke="none" />
      <path d="M4 10H2.5M14 10h1.5" />
    </svg>
  );
}
