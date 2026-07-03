"use client";

import "leaflet/dist/leaflet.css";
import { useRef } from "react";

import type { MarkerMeta } from "~/lib/map/marker-meta";
import type { AttractionSummary } from "~/types";

import { useLeafletMap } from "./hooks/useLeafletMap";
import { useLeafletMarkers } from "./hooks/useLeafletMarkers";
import { useMapCenteringAndBounds } from "./hooks/useMapCenteringAndBounds";

const EMPTY_ORDERS = new Map<number, number>();
const EMPTY_DAY_MAP = new Map<number, number>();
const EMPTY_DAY_COLORS = new Map<number, string>();

type BrowseLeafletMapProps = {
  attractions: AttractionSummary[];
  attractionsMap: Map<number, AttractionSummary>;
  selectedAttractionId: number | null;
  panelHeight: number;
  onMarkerClick: (attraction: AttractionSummary) => void;
  markerMeta: Map<number, MarkerMeta>;
};

export default function BrowseLeafletMap({
  attractions,
  attractionsMap,
  selectedAttractionId,
  panelHeight,
  onMarkerClick,
  markerMeta,
}: BrowseLeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { mapRef, hasInitializedBounds } = useLeafletMap(containerRef, attractions);

  useLeafletMarkers(
    mapRef,
    attractions,
    attractionsMap,
    EMPTY_DAY_MAP,
    EMPTY_DAY_COLORS,
    null,
    selectedAttractionId,
    null,
    EMPTY_ORDERS,
    onMarkerClick,
    true,
    markerMeta,
  );

  useMapCenteringAndBounds(
    mapRef,
    hasInitializedBounds,
    attractions,
    attractionsMap,
    [],
    null,
    selectedAttractionId,
    panelHeight,
    null,
  );

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
