"use client";

import "leaflet/dist/leaflet.css";
import { MapPin, Navigation } from "lucide-react";
import { useRef } from "react";

import type { Attraction, BasicAttraction, RouteData } from "~/types";
import { useGeolocationTracking } from "./hooks/useGeolocationTracking";
import { useLeafletMap } from "./hooks/useLeafletMap";
import { useLeafletMarkers } from "./hooks/useLeafletMarkers";
import type { MarkerMeta } from "./hooks/useLeafletMarkers";
import { useLeafletRoutes } from "./hooks/useLeafletRoutes";
import { useMapCenteringAndBounds } from "./hooks/useMapCenteringAndBounds";

type LeafletMapProps = {
  attractions: Attraction[];
  selectedDayAttractions: BasicAttraction[];
  selectedDayId: number | null;
  attractionToDayMap: Map<number, number>;
  dayColors: Map<number, string>;
  attractionsMap: Map<number, Attraction>;
  hoveredAttractionId: number | null;
  selectedAttractionId: number | null;
  panelHeight: number;
  onMarkerClick: (attraction: Attraction) => void;
  dayRoutes: Map<number, RouteData>;
  selectedDayAttractionOrders: Map<number, number>;
  enableLocationTracking?: boolean;
  enableClustering?: boolean;
  isLoadingRoutes: boolean;
  markerMeta?: Map<number, MarkerMeta>;
};

export default function LeafletMap({
  attractions,
  attractionsMap,
  selectedDayAttractions,
  selectedDayId,
  attractionToDayMap,
  dayColors,
  hoveredAttractionId,
  selectedAttractionId,
  panelHeight,
  onMarkerClick,
  dayRoutes,
  selectedDayAttractionOrders,
  enableLocationTracking = false,
  enableClustering = false,
  isLoadingRoutes,
  markerMeta,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { mapRef, hasInitializedBounds } = useLeafletMap(containerRef, attractions);

  useLeafletMarkers(
    mapRef,
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
  );

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

  useMapCenteringAndBounds(
    mapRef,
    hasInitializedBounds,
    attractions,
    attractionsMap,
    selectedDayAttractions,
    selectedDayId,
    selectedAttractionId,
    panelHeight,
    userLocation,
  );

  const showLoadingRoutesMessage =
    isLoadingRoutes && selectedDayId && selectedDayAttractions.length > 0;

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {enableLocationTracking && (
        <div className="absolute top-4 right-4 z-1000 flex flex-col gap-2">
          <button
            type="button"
            onClick={toggleLocationTracking}
            className={`rounded-lg p-3 shadow-lg transition-all ${
              isTrackingLocation
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
            title={
              isTrackingLocation
                ? "Stop tracking location"
                : "Track my location"
            }
          >
            <Navigation
              className={`h-5 w-5 ${isTrackingLocation ? "animate-pulse" : ""}`}
            />
          </button>
          {userLocation && (
            <button
              type="button"
              onClick={centerOnUserLocation}
              className="rounded-lg bg-white p-3 text-gray-700 shadow-lg transition-all hover:bg-gray-50"
              title="Center on my location"
            >
              <MapPin className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {showLoadingRoutesMessage && (
        <div className="absolute top-4 left-1/2 z-1000 -translate-x-1/2 rounded-lg bg-white p-3 font-medium whitespace-nowrap text-gray-700 shadow-md">
          Calculating Routes...
        </div>
      )}
    </div>
  );
}
