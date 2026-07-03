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
  selectedDayAttractions: BasicAttraction[];
  selectedDayId: number | null;
  attractionToDayMap: Map<number, number>;
  dayColors: Map<number, string>;
  hoveredAttractionId: number | null;
  dayRoutes: Map<number, RouteData>;
  selectedDayAttractionOrders: Map<number, number>;
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
  selectedDayAttractions,
  selectedDayId,
  attractionToDayMap,
  dayColors,
  hoveredAttractionId,
  dayRoutes,
  selectedDayAttractionOrders,
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
    attractionToDayMap,
    dayColors,
    hoveredAttractionId,
    selectedAttractionId,
    selectedDayId,
    selectedDayAttractionOrders,
    onMarkerClick,
    enableClustering,
    markerMeta,
  });

  useLeafletRoutes(
    mapRef,
    dayRoutes,
    dayColors,
    selectedDayId,
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
    selectedDayAttractions,
    selectedDayId,
    selectedAttractionId,
    panelHeight,
    userLocation,
  });

  const showLoadingRoutesMessage =
    isLoadingRoutes && !!selectedDayId && selectedDayAttractions.length > 0;

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
