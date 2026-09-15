"use client";

import dynamic from "next/dynamic";
import type { Lieu } from "@/lib/types";

const ExplorerMap = dynamic(() => import("./ExplorerMap"), { ssr: false });

export default function ExplorerMapWrapper({
  lieux,
  hoveredSlug,
  onHoverMarker,
}: {
  lieux: Lieu[];
  hoveredSlug: string | null;
  onHoverMarker: (slug: string | null) => void;
}) {
  return <ExplorerMap lieux={lieux} hoveredSlug={hoveredSlug} onHoverMarker={onHoverMarker} />;
}
