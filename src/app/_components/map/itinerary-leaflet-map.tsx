"use client";

import "~/lib/map/leaflet-styles";
import { useRef } from "react";

import type { MarkerMeta } from "~/lib/map/marker-meta";
import type { AttractionSummary, BasicAttraction, RouteData } from "~/types";

import { useGeolocationTracking } from "./useGeolocationTracking";
import { useLeafletMap } from "./useLeafletMap";
import { useLeafletMarkers } from "./useLeafletMarkers";
import { useLeafletRoutes } from "./useLeafletRoutes";
import { useMapCenteringAndBounds } from "./useMapCenteringAndBounds";
import { LeafletMapCanvas } from "./leaflet-map-core";

type ItineraryLeafletMapProps = {
  attractions: AttractionSummary[];
  attractionsMap: Map<number, AttractionSummary>;
  selectedAttractionId: number | null;
  panelHeight: number;
  onMarkerClick: (attraction: AttractionSummary) => void;
  selectedBlockAttractions: BasicAttraction[];
  selectedBlockId: number | null;
  attractionToBlockMap: Map<number, number>;
  blockColors: Map<number, string>;
  hoveredAttractionId: number | null;
  blockRoutes: Map<number, RouteData>;
  selectedBlockAttractionOrders: Map<number, number>;
  enableLocationTracking?: boolean;
  enableClustering?: boolean;
  isLoadingRoutes?: boolean;
  markerMeta?: Map<number, MarkerMeta>;
};

export default function ItineraryLeafletMap({
  attractions,
  attractionsMap,
  selectedAttractionId,
  panelHeight,
  onMarkerClick,
  selectedBlockAttractions,
  selectedBlockId,
  attractionToBlockMap,
  blockColors,
  hoveredAttractionId,
  blockRoutes,
  selectedBlockAttractionOrders,
  enableLocationTracking = false,
  enableClustering = false,
  isLoadingRoutes = false,
  markerMeta,
}: ItineraryLeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { mapRef, hasInitializedBounds, mapReady } = useLeafletMap(containerRef, attractions);

  useLeafletMarkers({
    mapRef,
    mapReady,
    attractions,
    attractionsMap,
    attractionToBlockMap,
    blockColors,
    hoveredAttractionId,
    selectedAttractionId,
    selectedBlockId,
    selectedBlockAttractionOrders,
    onMarkerClick,
    enableClustering,
    markerMeta,
  });

  useLeafletRoutes(
    mapRef,
    blockRoutes,
    blockColors,
    selectedBlockId,
    hoveredAttractionId,
    selectedAttractionId,
    isLoadingRoutes,
  );

  const {
    userLocation,
    isTrackingLocation,
    toggleLocationTracking,
    centerOnUserLocation,
  } = useGeolocationTracking(mapRef, enableLocationTracking);

  useMapCenteringAndBounds({
    mapRef,
    hasInitializedBounds,
    attractions,
    attractionsMap,
    selectedBlockAttractions,
    selectedBlockId,
    selectedAttractionId,
    panelHeight,
    userLocation,
  });

  const showLoadingRoutesMessage =
    isLoadingRoutes && !!selectedBlockId && selectedBlockAttractions.length > 0;

  return (
    <LeafletMapCanvas
      containerRef={containerRef}
      enableLocationTracking={enableLocationTracking}
      isTrackingLocation={isTrackingLocation}
      toggleLocationTracking={toggleLocationTracking}
      userLocation={userLocation}
      centerOnUserLocation={centerOnUserLocation}
      showLoadingRoutesMessage={showLoadingRoutesMessage}
    />
  );
}
