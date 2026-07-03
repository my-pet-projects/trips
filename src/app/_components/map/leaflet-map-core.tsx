"use client";

import { MapPin, Navigation } from "lucide-react";
import type { RefObject } from "react";

import { MapInlineLoading } from "~/lib/map/map-loading";

type LeafletMapCanvasProps = {
  containerRef: RefObject<HTMLDivElement | null>;
  enableLocationTracking?: boolean;
  isTrackingLocation?: boolean;
  toggleLocationTracking?: () => void;
  userLocation?: [number, number] | null;
  centerOnUserLocation?: () => void;
  showLoadingRoutesMessage?: boolean;
};

export function LeafletMapCanvas({
  containerRef,
  enableLocationTracking = false,
  isTrackingLocation = false,
  toggleLocationTracking,
  userLocation = null,
  centerOnUserLocation,
  showLoadingRoutesMessage = false,
}: LeafletMapCanvasProps) {
  return (
    <div className="relative h-full w-full" data-testid="map-canvas">
      <div ref={containerRef} className="h-full w-full" />

      {enableLocationTracking && toggleLocationTracking && centerOnUserLocation && (
        <div className="absolute top-4 right-4 z-1000 flex flex-col gap-2">
          <button
            type="button"
            data-testid="map-geo-track"
            onClick={toggleLocationTracking}
            className={`rounded-lg p-3 shadow-lg transition-all ${
              isTrackingLocation
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
            title={isTrackingLocation ? "Stop tracking location" : "Track my location"}
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
        <div className="absolute top-4 left-1/2 z-1000 -translate-x-1/2 rounded-lg bg-white px-4 py-2 shadow-md">
          <MapInlineLoading label="Calculating routes…" />
        </div>
      )}
    </div>
  );
}
