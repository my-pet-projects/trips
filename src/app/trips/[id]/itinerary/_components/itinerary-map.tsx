"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

import { type RouterOutputs } from "~/trpc/react";
import { AttractionDetailPanel } from "./attraction-detail-panel";

type Attraction =
  RouterOutputs["attraction"]["getAttractionsByCountries"][number];
type Trip = RouterOutputs["trip"]["getWithItinerary"];
type BasicAttraction =
  Trip["itineraryDays"][number]["itineraryDayPlaces"][number]["attraction"];
type RouteData = RouterOutputs["route"]["buildRoute"];

type ItineraryMapProps = {
  attractions: Attraction[];
  selectedDayAttractions: BasicAttraction[];
  selectedDayId: number | null;
  selectedAttractionId: number | null;
  allDaysAttractions: Map<number, BasicAttraction[]>;
  dayColors: Map<number, string>;
  hoveredAttractionId: number | null;
  dayRoutes: Map<number, RouteData>;
  onAttractionSelect: (attractionId: number | null) => void;
  onAddAttractionToDay: (attraction: BasicAttraction) => void;
  viewMode: "admin" | "viewer";
  enableLocationTracking?: boolean;
  isLoadingRoutes: boolean;
};

const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-sky-600" />
        <p className="text-sm text-gray-500">Loading map...</p>
      </div>
    </div>
  ),
});

export function ItineraryMap({
  attractions,
  selectedDayAttractions,
  selectedDayId,
  selectedAttractionId,
  allDaysAttractions,
  dayColors,
  hoveredAttractionId,
  dayRoutes,
  onAttractionSelect,
  onAddAttractionToDay,
  viewMode = "admin",
  enableLocationTracking = false,
  isLoadingRoutes,
}: ItineraryMapProps) {
  const [selectedAttraction, setSelectedAttraction] =
    useState<Attraction | null>(null);
  const [panelHeight, setPanelHeight] = useState(0);

  useEffect(() => {
    if (selectedAttractionId) {
      const attraction = attractions.find((a) => a.id === selectedAttractionId);
      setSelectedAttraction(attraction ?? null);
    } else {
      setSelectedAttraction(null);
    }
  }, [selectedAttractionId, attractions]);

  const attractionToDayMap = useMemo(() => {
    const map = new Map<number, number>();
    allDaysAttractions.forEach((dayAttractions, dayId) => {
      dayAttractions.forEach((attraction) => {
        map.set(attraction.id, dayId);
      });
    });
    return map;
  }, [allDaysAttractions]);

  const handleMarkerClick = useCallback(
    (attraction: Attraction) => {
      onAttractionSelect(attraction.id);
    },
    [onAttractionSelect],
  );

  const handleAddToDay = useCallback(() => {
    if (selectedAttraction) {
      onAddAttractionToDay(selectedAttraction);
    }
  }, [selectedAttraction, onAddAttractionToDay]);

  const handleClose = useCallback(() => {
    onAttractionSelect(null);
  }, [onAttractionSelect]);

  const attractionStatus = useMemo(() => {
    if (!selectedAttraction) return null;

    const dayId = attractionToDayMap.get(selectedAttraction.id);
    return {
      dayId,
      isInAnyDay: dayId !== undefined,
      isInSelectedDay: dayId === selectedDayId,
    };
  }, [selectedAttraction, attractionToDayMap, selectedDayId]);

  return (
    <div className="relative h-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Map */}
      <LeafletMap
        key="map"
        attractions={attractions}
        selectedDayAttractions={selectedDayAttractions}
        selectedDayId={selectedDayId}
        attractionToDayMap={attractionToDayMap}
        dayColors={dayColors}
        hoveredAttractionId={hoveredAttractionId}
        selectedAttractionId={selectedAttraction?.id ?? null}
        panelHeight={panelHeight}
        dayRoutes={dayRoutes}
        onMarkerClick={handleMarkerClick}
        enableLocationTracking={enableLocationTracking}
        isLoadingRoutes={isLoadingRoutes}
      />

      {/* Attraction Detail Panel */}
      {selectedAttraction && attractionStatus && (
        <AttractionDetailPanel
          attraction={selectedAttraction}
          attractionStatus={attractionStatus}
          selectedDayId={selectedDayId}
          viewMode={viewMode}
          onClose={handleClose}
          onAddToDay={viewMode === "admin" ? handleAddToDay : undefined}
          onPanelHeightChange={setPanelHeight}
        />
      )}
    </div>
  );
}
