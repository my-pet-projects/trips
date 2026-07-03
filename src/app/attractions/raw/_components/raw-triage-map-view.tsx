"use client";

import dynamic from "next/dynamic";

import { MapDynamicLoading } from "~/lib/map/map-loading";

export const RawTriageMapView = dynamic(
  () =>
    import("./raw-triage-map-view-inner").then((m) => ({
      default: m.RawTriageMapViewInner,
    })),
  {
    ssr: false,
    loading: () => <MapDynamicLoading label="Loading map…" />,
  },
);
