"use client";

import dynamic from "next/dynamic";

import { MapDynamicLoading } from "~/lib/map/map-loading";

const RawTriageMapView = dynamic(
  () => import("./raw-triage-map-view").then((m) => m.RawTriageMapView),
  {
    ssr: false,
    loading: () => <MapDynamicLoading label="Loading map…" />,
  },
);

interface RawAttractionsMapProps {
  countryCode?: string;
}

export function RawAttractionsMap({ countryCode }: RawAttractionsMapProps) {
  return <RawTriageMapView countryCode={countryCode} />;
}
