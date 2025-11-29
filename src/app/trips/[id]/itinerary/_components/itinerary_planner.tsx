"use client";

import { Plus, Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";
import { ItineraryDay } from "./itinerary-day";
import { ItineraryMap } from "./itinerary-map";

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

type ItineraryPlannerProps = {
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

const generateDayColor = (index: number): string =>
  DAY_COLORS[index % DAY_COLORS.length]!;

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

function useRouteManager() {
  const [dayRoutes, setDayRoutes] = useState<Map<number, RouteData>>(new Map());
  const [loadingRoutes, setLoadingRoutes] = useState<Map<number, boolean>>(
    new Map(),
  );

  const updateRoute = useCallback(
    (dayId: number, route: RouteData | null, isLoading: boolean) => {
      setLoadingRoutes((prev) => {
        const next = new Map(prev);
        next.set(dayId, isLoading);
        return next;
      });

      // Only update route when we have data (keep old route while loading new one)
      if (route) {
        setDayRoutes((prev) => {
          const next = new Map(prev);
          next.set(dayId, route);
          return next;
        });
      } else if (!isLoading) {
        // Only clear route if we're not loading (i.e., there are fewer than 2 attractions)
        setDayRoutes((prev) => {
          const next = new Map(prev);
          next.delete(dayId);
          return next;
        });
      }
    },
    [],
  );

  const clearRoute = useCallback((dayId: number) => {
    setDayRoutes((prev) => {
      const next = new Map(prev);
      next.delete(dayId);
      return next;
    });
    setLoadingRoutes((prev) => {
      const next = new Map(prev);
      next.delete(dayId);
      return next;
    });
  }, []);

  return { dayRoutes, loadingRoutes, updateRoute, clearRoute };
}

function useDayRouteFetch(
  dayId: number,
  attractions: BasicAttraction[],
  onUpdate: (
    dayId: number,
    route: RouteData | null,
    isLoading: boolean,
  ) => void,
) {
  const validAttractions = attractions.filter(
    (a) => a.latitude != null && a.longitude != null,
  );

  const shouldFetch = validAttractions.length >= 2;

  const { data: route, isFetching } = api.route.buildRoute.useQuery(
    {
      points: validAttractions.map((a) => ({
        id: a.id,
        lat: a.latitude!,
        lng: a.longitude!,
      })),
    },
    {
      enabled: shouldFetch,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  );

  // Update parent whenever route or loading state changes
  useEffect(() => {
    if (shouldFetch) {
      onUpdate(dayId, route ?? null, isFetching);
    } else {
      onUpdate(dayId, null, false);
    }
  }, [route, isFetching, shouldFetch, dayId, onUpdate]);
}

function DayRoutesFetcher({
  itineraryDays,
  onUpdate,
}: {
  itineraryDays: ItineraryDayData[];
  onUpdate: (
    dayId: number,
    route: RouteData | null,
    isLoading: boolean,
  ) => void;
}) {
  return (
    <>
      {itineraryDays.map((day) => (
        <DayRouteFetcherItem
          key={day.id}
          dayId={day.id}
          attractions={day.attractions}
          onUpdate={onUpdate}
        />
      ))}
    </>
  );
}

function DayRouteFetcherItem({
  dayId,
  attractions,
  onUpdate,
}: {
  dayId: number;
  attractions: BasicAttraction[];
  onUpdate: (
    dayId: number,
    route: RouteData | null,
    isLoading: boolean,
  ) => void;
}) {
  useDayRouteFetch(dayId, attractions, onUpdate);
  return null;
}

export function ItineraryPlanner({
  trip,
  tripAttractions: attractions,
}: ItineraryPlannerProps) {
  const [itineraryDays, setItineraryDays] = useState<ItineraryDayData[]>(() =>
    transformTripDays(trip),
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(
    itineraryDays[0]?.id ?? null,
  );
  const [dayBeingRemoved, setDayBeingRemoved] = useState<number | null>(null);
  const [hoveredAttraction, setHoveredAttraction] = useState<number | null>(
    null,
  );
  const [selectedAttractionId, setSelectedAttractionId] = useState<
    number | null
  >(null);

  const originalItineraryRef = useRef(trip.itineraryDays);
  const utils = api.useUtils();

  // Route management
  const { dayRoutes, loadingRoutes, updateRoute, clearRoute } =
    useRouteManager();

  // Computed values
  const allDaysAttractions = useMemo(() => {
    const map = new Map<number, BasicAttraction[]>();
    itineraryDays.forEach((day) => map.set(day.id, day.attractions));
    return map;
  }, [itineraryDays]);

  const dayColors = useMemo(() => {
    const map = new Map<number, string>();
    itineraryDays.forEach((day, index) =>
      map.set(day.id, generateDayColor(index)),
    );
    return map;
  }, [itineraryDays]);

  const attractionToDayMap = useMemo(() => {
    const map = new Map<number, ItineraryDayData>();
    itineraryDays.forEach((day) => {
      day.attractions.forEach((attraction) => map.set(attraction.id, day));
    });
    return map;
  }, [itineraryDays]);

  const hasUnsavedChanges = useMemo(() => {
    if (itineraryDays.length !== originalItineraryRef.current.length)
      return true;

    return itineraryDays.some((day) => {
      const original = originalItineraryRef.current.find(
        (d) => d.id === day.id,
      );
      if (!original) return true;
      if (day.name !== original.name || day.dayNumber !== original.dayNumber)
        return true;

      const originalIds = original.itineraryDayPlaces
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((p) => p.attractionId);
      const currentIds = day.attractions.map((a) => a.id);

      return (
        originalIds.length !== currentIds.length ||
        originalIds.some((id, idx) => id !== currentIds[idx])
      );
    });
  }, [itineraryDays]);

  // Mutations
  const createDay = api.itinerary.createItineraryDay.useMutation({
    onMutate: async (newDayData) => {
      await utils.trip.getWithItinerary.cancel();

      // Optimistic update with temp ID
      const tempId = -Date.now();
      setItineraryDays((prev) => [
        ...prev,
        {
          id: tempId,
          name: newDayData.name,
          dayNumber: newDayData.dayNumber,
          attractions: [],
        },
      ]);
      setSelectedDay(tempId);
      return { tempId };
    },
    onSuccess: (newDay, _, context) => {
      // Replace temp ID with real ID from server
      setItineraryDays((prev) =>
        prev.map((day) =>
          day.id === context?.tempId ? { ...day, id: newDay.id } : day,
        ),
      );
      setSelectedDay(newDay.id);
      toast.success("Day added successfully");
      void utils.trip.invalidate();
    },
    onError: (err, _, context) => {
      if (context?.tempId) {
        setItineraryDays((prev) =>
          prev.filter((day) => day.id !== context.tempId),
        );
        setSelectedDay((prev) =>
          prev === context.tempId ? (itineraryDays[0]?.id ?? null) : prev,
        );
      }
      toast.error("Failed to add day", {
        description: err.message || "Please try again.",
      });
    },
  });

  const deleteDay = api.itinerary.deleteItineraryDay.useMutation({
    onSuccess: async (_, variables) => {
      setItineraryDays((prevDays) => {
        const filtered = prevDays.filter((d) => d.id !== variables.dayId);
        const reordered = filtered.map((d, i) => ({ ...d, dayNumber: i + 1 }));

        setSelectedDay((prevSelected) =>
          prevSelected === variables.dayId
            ? (reordered[0]?.id ?? null)
            : prevSelected,
        );

        // Check if we need to send reordering to backend
        const needsReorder = filtered.some((d, i) => d.dayNumber !== i + 1);
        if (needsReorder && reordered.length > 0) {
          updateDays.mutate({
            tripId: trip.id,
            days: reordered.map((d) => ({
              id: d.id,
              name: d.name,
              dayNumber: d.dayNumber,
              attractions: d.attractions.map((a, idx) => ({
                attractionId: a.id,
                order: idx + 1,
              })),
            })),
          });
        }

        return reordered;
      });

      clearRoute(variables.dayId);
      toast.success("Day removed");
      void utils.trip.invalidate();
    },
    onError: (err) => {
      toast.error("Failed to remove day", {
        description: err.message || "Please try again.",
      });
    },
    onSettled: () => setDayBeingRemoved(null),
  });

  const updateDays = api.itinerary.updateItineraryDays.useMutation({
    onSuccess: () => {
      originalItineraryRef.current = trip.itineraryDays;
      toast.success("Itinerary saved");
      void utils.trip.invalidate();
    },
    onError: (err) => {
      toast.error("Failed to save itinerary", {
        description: err.message || "Please try again.",
      });
    },
  });

  // Event handlers
  const handleAddDay = useCallback(() => {
    const newDayNumber = itineraryDays.length + 1;
    createDay.mutate({
      tripId: trip.id,
      name: `Day ${newDayNumber}`,
      dayNumber: newDayNumber,
    });
  }, [trip.id, itineraryDays.length, createDay]);

  const handleRemoveDay = useCallback(
    (dayId: number) => {
      setDayBeingRemoved(dayId);
      deleteDay.mutate({ dayId });
    },
    [deleteDay],
  );

  const handleSave = useCallback(() => {
    updateDays.mutate({
      tripId: trip.id,
      days: itineraryDays.map((day) => ({
        id: day.id,
        name: day.name,
        dayNumber: day.dayNumber,
        attractions: day.attractions.map((attraction, index) => ({
          attractionId: attraction.id,
          order: index + 1,
        })),
      })),
    });
  }, [trip.id, itineraryDays, updateDays]);

  const handleAddAttractionToDay = useCallback(
    (attraction: BasicAttraction) => {
      if (!selectedDay) {
        toast.error("No day selected", {
          description: "Please select a day to add attractions.",
        });
        return;
      }

      const existingDay = attractionToDayMap.get(attraction.id);
      if (existingDay) {
        toast.info("Attraction already added", {
          description: `This attraction is already in ${existingDay.name}.`,
        });
        return;
      }

      setItineraryDays((prev) =>
        prev.map((d) =>
          d.id === selectedDay
            ? { ...d, attractions: [...d.attractions, attraction] }
            : d,
        ),
      );

      setSelectedAttractionId(null);
      toast.success("Attraction added", {
        description: `${attraction.name} has been added.`,
      });
    },
    [selectedDay, attractionToDayMap],
  );

  const handleMoveDay = useCallback(
    (dayId: number, direction: "up" | "down") => {
      setItineraryDays((prevDays) => {
        const newDays = [...prevDays];
        const index = newDays.findIndex((d) => d.id === dayId);
        if (index === -1) return prevDays;

        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newDays.length) return prevDays;

        const [movedDay] = newDays.splice(index, 1);
        newDays.splice(targetIndex, 0, movedDay!);

        return newDays.map((d, i) => ({ ...d, dayNumber: i + 1 }));
      });
    },
    [],
  );

  // Sync with server updates
  useEffect(() => {
    if (!hasUnsavedChanges) {
      originalItineraryRef.current = trip.itineraryDays;
      setItineraryDays(transformTripDays(trip));
    }
  }, [trip, hasUnsavedChanges]);

  return (
    <>
      {/* Fetch routes for all days */}
      <DayRoutesFetcher itineraryDays={itineraryDays} onUpdate={updateRoute} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Days List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Daily Itinerary
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddDay}
                disabled={createDay.isPending}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {createDay.isPending ? "Adding..." : "Add Day"}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={updateDays.isPending || !hasUnsavedChanges}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {updateDays.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          {itineraryDays.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
              <p className="mb-4 text-gray-600">
                No days in your itinerary yet.
              </p>
              <button
                type="button"
                onClick={handleAddDay}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700"
              >
                <Plus className="h-4 w-4" />
                Add First Day
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {itineraryDays.map((day, index) => (
                <ItineraryDay
                  key={day.id}
                  day={day}
                  color={generateDayColor(index)}
                  isSelected={selectedDay === day.id}
                  onSelect={() => setSelectedDay(day.id)}
                  onRemove={() => handleRemoveDay(day.id)}
                  onRemoveAttraction={(dayId, attractionId) =>
                    setItineraryDays((prev) =>
                      prev.map((d) =>
                        d.id === dayId
                          ? {
                              ...d,
                              attractions: d.attractions.filter(
                                (a) => a.id !== attractionId,
                              ),
                            }
                          : d,
                      ),
                    )
                  }
                  onAttractionHover={setHoveredAttraction}
                  onAttractionClick={(attractionId) => {
                    setSelectedAttractionId(attractionId);
                    const day = attractionToDayMap.get(attractionId);
                    if (day) setSelectedDay(day.id);
                  }}
                  selectedAttractionId={selectedAttractionId}
                  isRemoving={dayBeingRemoved === day.id}
                  isDragging={false}
                  onReorderAttractions={(dayId, reorderedAttractions) =>
                    setItineraryDays((prev) =>
                      prev.map((d) =>
                        d.id === dayId
                          ? { ...d, attractions: reorderedAttractions }
                          : d,
                      ),
                    )
                  }
                  onMoveUp={() => handleMoveDay(day.id, "up")}
                  onMoveDown={() => handleMoveDay(day.id, "down")}
                  routeData={dayRoutes.get(day.id)}
                  isLoadingRoute={loadingRoutes.get(day.id) ?? false}
                />
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
          <ItineraryMap
            attractions={attractions}
            selectedDayAttractions={
              itineraryDays.find((d) => d.id === selectedDay)?.attractions ?? []
            }
            selectedDayId={selectedDay}
            selectedAttractionId={selectedAttractionId}
            allDaysAttractions={allDaysAttractions}
            dayColors={dayColors}
            hoveredAttractionId={hoveredAttraction}
            dayRoutes={dayRoutes}
            onAttractionSelect={setSelectedAttractionId}
            onAddAttractionToDay={handleAddAttractionToDay}
          />
        </div>
      </div>
    </>
  );
}
