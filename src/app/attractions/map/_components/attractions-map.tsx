"use client";

import dynamic from "next/dynamic";

import { MapDynamicLoading } from "~/lib/map/map-loading";

const BrowseMapView = dynamic(
  () => import("./browse-map-view").then((m) => m.BrowseMapView),
  {
    ssr: false,
    loading: () => <MapDynamicLoading label="Loading map…" />,
  },
);

export function AttractionsMap() {
  return <BrowseMapView />;
}
