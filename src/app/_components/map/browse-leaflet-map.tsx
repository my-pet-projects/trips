"use client";

import "~/lib/map/leaflet-styles";
import { useRef } from "react";

import type { MarkerMeta } from "~/lib/map/marker-meta";
import type { AttractionSummary } from "~/types";

import { useLeafletMap } from "./useLeafletMap";
import { useLeafletMarkers } from "./useLeafletMarkers";
import { useMapCenteringAndBounds } from "./useMapCenteringAndBounds";
import { LeafletMapCanvas } from "./leaflet-map-core";

type BrowseLeafletMapProps = {
  attractions: AttractionSummary[];
  attractionsMap: Map<number, AttractionSummary>;
  selectedAttractionId: number | null;
  panelHeight: number;
  onMarkerClick: (attraction: AttractionSummary) => void;
  markerMeta?: Map<number, MarkerMeta>;
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
  const { mapRef, hasInitializedBounds, mapReady } = useLeafletMap(containerRef, attractions);

  useLeafletMarkers({
    mapRef,
    mapReady,
    attractions,
    attractionsMap,
    selectedAttractionId,
    onMarkerClick,
    enableClustering: true,
    markerMeta,
  });

  useMapCenteringAndBounds({
    mapRef,
    hasInitializedBounds,
    attractions,
    attractionsMap,
    selectedAttractionId,
    panelHeight,
  });

  return <LeafletMapCanvas containerRef={containerRef} />;
}
