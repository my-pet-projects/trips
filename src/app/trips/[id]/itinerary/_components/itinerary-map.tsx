"use client";

import { ExternalLink, MapPin, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { type RouterOutputs } from "~/trpc/react";
import { AttractionImageGallery } from "./attraction-image-gallery";

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
}: ItineraryMapProps) {
  const [selectedAttraction, setSelectedAttraction] =
    useState<Attraction | null>(null);
  const [panelHeight, setPanelHeight] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedAttractionId) {
      const attraction = attractions.find((a) => a.id === selectedAttractionId);
      setSelectedAttraction(attraction ?? null);
    } else {
      setSelectedAttraction(null);
    }
  }, [selectedAttractionId, attractions]);

  // Track panel height for map padding
  useEffect(() => {
    if (!selectedAttraction) {
      setPanelHeight(0);
      return;
    }

    if (!panelRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setPanelHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(panelRef.current);
    return () => resizeObserver.disconnect();
  }, [selectedAttraction]);

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
        key={`map-${dayRoutes.size}`}
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
      />

      {/* Attraction Detail Panel */}
      {selectedAttraction && attractionStatus && (
        <div
          ref={panelRef}
          className="absolute right-0 bottom-0 left-0 z-1000 max-h-[60%] overflow-y-auto border-t border-gray-200 bg-white shadow-lg"
        >
          <div className="p-4">
            {/* Header */}
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="shrink-0">
                  <div className="rounded-full bg-sky-100 px-2 py-1">
                    <MapPin className="h-5 w-5 text-sky-600" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg leading-tight font-semibold text-gray-900">
                    {selectedAttraction.name}
                  </h3>
                  {selectedAttraction.nameLocal &&
                    selectedAttraction.nameLocal !==
                      selectedAttraction.name && (
                      <p className="text-sm leading-tight text-gray-600">
                        {selectedAttraction.nameLocal}
                      </p>
                    )}
                  <p className="mt-1 text-sm leading-tight text-gray-500">
                    {selectedAttraction.city.name},{" "}
                    {selectedAttraction.city.country.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Description */}
            {selectedAttraction.description && (
              <div className="mb-4 rounded-lg bg-gray-50 p-3">
                <p className="text-sm leading-relaxed text-gray-700">
                  {selectedAttraction.description}
                </p>
              </div>
            )}

            {/* Address */}
            {selectedAttraction.address && (
              <div className="mb-4">
                <p className="mb-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Address
                </p>
                <p className="text-sm text-gray-700">
                  {selectedAttraction.address}
                </p>
              </div>
            )}

            {/* External Link */}
            {selectedAttraction.sourceUrl && (
              <div className="mb-4">
                <a
                  href={selectedAttraction.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-sky-600 transition-colors hover:text-sky-700"
                >
                  View more information
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}

            {/* Attraction Images */}
            <AttractionImageGallery attraction={selectedAttraction} />

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddToDay}
                disabled={!selectedDayId}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  attractionStatus.isInAnyDay || !selectedDayId
                    ? "cursor-not-allowed bg-gray-100 text-gray-400"
                    : "bg-sky-600 text-white hover:bg-sky-700"
                }`}
              >
                {!selectedDayId
                  ? "Select a day first"
                  : attractionStatus.isInAnyDay
                    ? attractionStatus.isInSelectedDay
                      ? "Already in this day"
                      : "Already in another day"
                    : "Add to Day"}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
