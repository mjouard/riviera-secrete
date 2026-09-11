"use client";
import dynamic from "next/dynamic";

const LeafletItinMap = dynamic(() => import("./LeafletItinMap"), { ssr: false });

interface Props {
  stops: Array<{ lat: number; lng: number; nom: string }>;
}

export default function MapItinWrapper(props: Props) {
  return <LeafletItinMap {...props} />;
}
