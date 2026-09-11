"use client";
import dynamic from "next/dynamic";
import type { Ville } from "@/lib/types";

const HomeMap = dynamic(() => import("./HomeMap"), { ssr: false });

export default function HomeMapWrapper({ villes }: { villes: Ville[] }) {
  return <HomeMap villes={villes} />;
}
