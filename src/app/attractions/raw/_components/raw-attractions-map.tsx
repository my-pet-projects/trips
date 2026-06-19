"use client";

import dynamic from "next/dynamic";

const RawAttractionsMapInner = dynamic(
  () => import("./raw-attractions-map-inner").then((m) => m.RawAttractionsMapInner),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-gray-500">Loading map…</div> },
);

interface RawAttractionsMapProps {
  countryCode?: string;
}

export function RawAttractionsMap({ countryCode }: RawAttractionsMapProps) {
  return <RawAttractionsMapInner countryCode={countryCode} />;
}
