"use client";

import { MapPin, Navigation } from "lucide-react";
import type { RefObject } from "react";

import { Button } from "~/app/_components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/app/_components/ui/tooltip";
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
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  data-testid="map-geo-track"
                  size="icon"
                  onClick={toggleLocationTracking}
                  className={
                    isTrackingLocation
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }
                />
              }
            >
              <Navigation
                className={`h-5 w-5 ${isTrackingLocation ? "animate-pulse" : ""}`}
              />
            </TooltipTrigger>
            <TooltipContent>
              {isTrackingLocation ? "Stop tracking location" : "Track my location"}
            </TooltipContent>
          </Tooltip>
          {userLocation && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="bg-white text-gray-700 hover:bg-gray-50"
                    onClick={centerOnUserLocation}
                  />
                }
              >
                <MapPin className="h-5 w-5" />
              </TooltipTrigger>
              <TooltipContent>Center on my location</TooltipContent>
            </Tooltip>
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
