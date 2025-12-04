"use client";

import "leaflet/dist/leaflet.css";
import { MapPin, Navigation } from "lucide-react";
import { useMemo, useRef } from "react";

import type { RouterOutputs } from "~/trpc/react";
import { useGeolocationTracking } from "./hooks/useGeolocationTracking";
import { useLeafletMap } from "./hooks/useLeafletMap";
import { useLeafletMarkers } from "./hooks/useLeafletMarkers";
import { useLeafletRoutes } from "./hooks/useLeafletRoutes";
import { useMapCenteringAndBounds } from "./hooks/useMapCenteringAndBounds";

type Attraction =
  RouterOutputs["attraction"]["getAttractionsByCountries"][number];
type Trip = RouterOutputs["trip"]["getWithItinerary"];
type BasicAttraction =
  Trip["itineraryDays"][number]["itineraryDayPlaces"][number]["attraction"];
type RouteData = RouterOutputs["route"]["buildRoute"];

type LeafletMapProps = {
  attractions: Attraction[];
  selectedDayAttractions: BasicAttraction[];
  selectedDayId: number | null;
  attractionToDayMap: Map<number, number>;
  dayColors: Map<number, string>;
  hoveredAttractionId: number | null;
  selectedAttractionId: number | null;
  panelHeight: number;
  onMarkerClick: (attraction: Attraction) => void;
  dayRoutes: Map<number, RouteData>;
  enableLocationTracking?: boolean;
  isLoadingRoutes: boolean;
};

export default function LeafletMap({
  attractions,
  selectedDayAttractions,
  selectedDayId,
  attractionToDayMap,
  dayColors,
  hoveredAttractionId,
  selectedAttractionId,
  panelHeight,
  onMarkerClick,
  dayRoutes,
  enableLocationTracking = false,
  isLoadingRoutes,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { mapRef, hasInitializedBounds } = useLeafletMap(
    containerRef,
    attractions,
  );

  const selectedDayAttractionOrders = useMemo(() => {
    const map = new Map<number, number>();
    selectedDayAttractions.forEach((attr, index) => {
      map.set(attr.id, index + 1);
    });
    return map;
  }, [selectedDayAttractions]);

  useLeafletMarkers(
    mapRef,
    attractions,
    attractionToDayMap,
    dayColors,
    hoveredAttractionId,
    selectedAttractionId,
    selectedDayId,
    selectedDayAttractionOrders,
    onMarkerClick,
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

      {/* Location controls */}
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

      {/* Loading route indicator */}
      {showLoadingRoutesMessage && (
        <div className="absolute top-4 left-1/2 z-1000 -translate-x-1/2 rounded-lg bg-white p-3 font-medium whitespace-nowrap text-gray-700 shadow-md">
          Calculating Routes...
        </div>
      )}
    </div>
  );
}
