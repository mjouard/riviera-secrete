import type { ButtonHTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";

/**
 * Refonte UI Lot 1 — puce de filtre (docs/design-refonte-2026-09-14.md § 1 "Filtres & badges").
 * 44px de haut, forme pilule. Sélectionné = fond Calcaire / texte Nuit — jamais Aube (l'Aube
 * est réservée à l'action). `as="label"` couvre le pattern case-à-cocher-en-pilule existant
 * (ex. "masquer fermées" dans ActivitesGrid.tsx).
 */
const CHIP_STYLE = "inline-flex items-center h-11 px-4 rounded-full text-sm font-medium transition-colors focus-ring-aube";

type ChipCommon = {
  selected: boolean;
  children: ReactNode;
  className?: string;
};

function chipStyle(selected: boolean) {
  return selected
    ? { background: "var(--calcaire)", color: "var(--nuit)", border: "1px solid var(--calcaire)" }
    : { background: "transparent", color: "var(--brume)", border: "1px solid var(--line)" };
}

type ChipButtonProps = ChipCommon &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { as?: "button" };

type ChipLabelProps = ChipCommon &
  Omit<LabelHTMLAttributes<HTMLLabelElement>, "className" | "children"> & { as: "label" };

export function Chip(props: ChipButtonProps | ChipLabelProps) {
  const { selected, children, className = "", as = "button", ...rest } = props;
  const style = chipStyle(selected);

  if (as === "label") {
    return (
      <label className={`${CHIP_STYLE} cursor-pointer ${className}`} style={style} {...(rest as LabelHTMLAttributes<HTMLLabelElement>)}>
        {children}
      </label>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`${CHIP_STYLE} ${className}`}
      style={style}
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}
