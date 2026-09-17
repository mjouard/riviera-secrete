"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

interface HoverCtx {
  hoveredSlug: string | null;
  onHover: (slug: string | null) => void;
}

const ExplorerHoverContext = createContext<HoverCtx>({ hoveredSlug: null, onHover: () => {} });

export function ExplorerHoverProvider({
  value,
  children,
}: {
  value: HoverCtx;
  children: ReactNode;
}) {
  return <ExplorerHoverContext.Provider value={value}>{children}</ExplorerHoverContext.Provider>;
}

export function useExplorerHover(): HoverCtx {
  return useContext(ExplorerHoverContext);
}
