"use client";
import dynamic from "next/dynamic";

const LeafletLieuMap = dynamic(() => import("./LeafletLieuMap"), { ssr: false });

interface Props {
  lat: number;
  lng: number;
  nom: string;
}

export default function MapLieuWrapper(props: Props) {
  return <LeafletLieuMap {...props} />;
}
