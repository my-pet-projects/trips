"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { ItineraryMap } from "~/app/_components/map/itinerary-map";
import { DayRoutesFetcher } from "~/app/_components/map/route-fetcher";
import type { RouterOutputs } from "~/trpc/react";

type Trip = RouterOutputs["trip"]["getWithItinerary"];
type Attraction =
  RouterOutputs["attraction"]["getAttractionsByCountries"][number];
type BasicAttraction =
  Trip["itineraryDays"][number]["itineraryDayPlaces"][number]["attraction"];
type RouteData = RouterOutputs["route"]["buildRoute"];

type ItineraryDayData = {
  id: number;
  name: string;
  dayNumber: number;
  attractions: BasicAttraction[];
};

type ItineraryViewerProps = {
  trip: Trip;
  tripAttractions: Attraction[];
};

const DAY_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#14b8a6",
  "#a855f7",
  "#84cc16",
  "#f43f5e",
] as const;

const transformTripDays = (trip: Trip): ItineraryDayData[] => {
  if (!trip) return [];
  return trip.itineraryDays.map((day) => ({
    id: day.id,
    name: day.name,
    dayNumber: day.dayNumber,
    attractions: day.itineraryDayPlaces
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((place) => place.attraction),
  }));
};

export function ItineraryViewer({
  trip,
  tripAttractions: attractions,
}: ItineraryViewerProps) {
  const itineraryDays = useMemo(() => transformTripDays(trip), [trip]);

  const [selectedDayId, setSelectedDayId] = useState<number | null>(
    itineraryDays[0]?.id ?? null,
  );
  const [selectedAttractionId, setSelectedAttractionId] = useState<
    number | null
  >(null);

  // Route management
  const [dayRoutes, setDayRoutes] = useState<Map<number, RouteData>>(
    () => new Map(),
  );
  const [loadingRoutes, setLoadingRoutes] = useState<Map<number, boolean>>(
    () => new Map(),
  );

  const isLoadingRoutes = useMemo(
    () => [...loadingRoutes.values()].some(Boolean),
    [loadingRoutes],
  );

  const updateRoute = useCallback(
    (
      dayId: number,
      route: RouteData | null,
      isLoading: boolean,
      error?: Error,
    ) => {
      if (error) {
        console.error("Failed to build route for day", dayId, error);
      }
      setLoadingRoutes((prev) => {
        const newMap = new Map(prev);
        newMap.set(dayId, isLoading);
        return newMap;
      });

      setDayRoutes((prev) => {
        const newMap = new Map(prev);
        if (route) {
          newMap.set(dayId, route);
        } else if (!isLoading) {
          newMap.delete(dayId);
        }
        return newMap;
      });
    },
    [],
  );

  const selectedDay = useMemo(
    () => itineraryDays.find((d) => d.id === selectedDayId),
    [itineraryDays, selectedDayId],
  );

  const allDaysAttractions = useMemo(() => {
    const map = new Map<number, BasicAttraction[]>();
    itineraryDays.forEach((day) => map.set(day.id, day.attractions));
    return map;
  }, [itineraryDays]);

  const dayColors = useMemo(() => {
    const map = new Map<number, string>();
    itineraryDays.forEach((day, index) =>
      map.set(day.id, DAY_COLORS[index % DAY_COLORS.length]!),
    );
    return map;
  }, [itineraryDays]);

  const dayColor = useMemo(
    () => dayColors.get(selectedDayId ?? 0) ?? "#3b82f6",
    [dayColors, selectedDayId],
  );

  const selectedDayIndex = itineraryDays.findIndex(
    (d) => d.id === selectedDayId,
  );
  const canGoPrevDay = selectedDayIndex > 0;
  const canGoNextDay =
    selectedDayIndex >= 0 && selectedDayIndex < itineraryDays.length - 1;

  const handlePrevDay = useCallback(() => {
    if (canGoPrevDay) {
      const prevDay = itineraryDays[selectedDayIndex - 1];
      if (prevDay) {
        setSelectedDayId(prevDay.id);
        setSelectedAttractionId(null);
      }
    }
  }, [canGoPrevDay, itineraryDays, selectedDayIndex]);

  const handleNextDay = useCallback(() => {
    if (canGoNextDay) {
      const nextDay = itineraryDays[selectedDayIndex + 1];
      if (nextDay) {
        setSelectedDayId(nextDay.id);
        setSelectedAttractionId(null);
      }
    }
  }, [canGoNextDay, itineraryDays, selectedDayIndex]);

  const handleAddAttractionToDay = useCallback(() => {
    // Do nothing - this is view-only mode
  }, []);

  return (
    <>
      {/* Fetch routes for all days */}
      <DayRoutesFetcher itineraryDays={itineraryDays} onUpdate={updateRoute} />

      <div className="flex h-screen flex-col bg-gray-50">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevDay}
              disabled={!canGoPrevDay}
              className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Previous day"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded-full shadow-md"
                style={{ backgroundColor: dayColor }}
              />
              <h1 className="text-lg font-bold text-gray-900">
                {selectedDay?.name}
              </h1>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                {selectedDay?.attractions.length ?? 0} stops
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextDay}
              disabled={!canGoNextDay}
              className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Next day"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="relative flex-1 overflow-hidden">
          <ItineraryMap
            attractions={attractions}
            selectedDayAttractions={selectedDay?.attractions ?? []}
            selectedDayId={selectedDayId}
            selectedAttractionId={selectedAttractionId}
            allDaysAttractions={allDaysAttractions}
            dayColors={dayColors}
            hoveredAttractionId={null}
            dayRoutes={dayRoutes}
            onAttractionSelect={setSelectedAttractionId}
            onAddAttractionToDay={handleAddAttractionToDay}
            viewMode="viewer"
            enableLocationTracking
            isLoadingRoutes={isLoadingRoutes}
          />
        </div>

        {/* Attractions List */}
        {selectedDay &&
          selectedDay.attractions.length > 0 &&
          !selectedAttractionId && (
            <div className="border-t border-gray-200 bg-white p-4 shadow-lg">
              <h2 className="mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase">
                Attractions for {selectedDay.name}
              </h2>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {selectedDay.attractions.map((attraction, index) => (
                  <button
                    type="button"
                    key={attraction.id}
                    onClick={() => setSelectedAttractionId(attraction.id)}
                    className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-left transition-colors hover:bg-gray-100 active:bg-gray-200"
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow"
                      style={{ backgroundColor: dayColor }}
                    >
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">
                        {attraction.name}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
      </div>
    </>
  );
}
