"use client";

import { Plus, Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";
import { ItineraryDay } from "./itinerary-day";

type Trip = RouterOutputs["trip"]["getWithItinerary"];
type Attraction =
  RouterOutputs["attraction"]["getAttractionsByCountries"][number];
type BasicAttraction =
  Trip["itineraryDays"][number]["itineraryDayPlaces"][number]["attraction"];

type ItineraryPlannerProps = {
  trip: Trip;
  tripAttractions: Attraction[];
};

type ItineraryDayData = {
  id: number;
  name: string;
  dayNumber: number;
  attractions: BasicAttraction[];
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

export function ItineraryPlanner({
  trip,
  tripAttractions: attractions,
}: ItineraryPlannerProps) {
  const [itineraryDays, setItineraryDays] = useState<ItineraryDayData[]>(() => {
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
  });

  const [selectedDay, setSelectedDay] = useState<number | null>(
    itineraryDays[0]?.id ?? null,
  );
  const [dayBeingRemoved, setDayBeingRemoved] = useState<number | null>(null);
  const [hoveredAttraction, setHoveredAttraction] = useState<number | null>(
    null,
  );

  const originalItineraryRef = useRef(trip.itineraryDays);
  const utils = api.useUtils();

  // Check for unsaved changes
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

  // Update ref when trip changes
  useEffect(() => {
    originalItineraryRef.current = trip.itineraryDays;
    // Only sync if no unsaved changes to avoid data loss
    if (!hasUnsavedChanges) {
      setItineraryDays(
        trip.itineraryDays.map((day) => ({
          id: day.id,
          name: day.name,
          dayNumber: day.dayNumber,
          attractions: day.itineraryDayPlaces
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((place) => place.attraction),
        })),
      );
    }
  }, [trip.itineraryDays, hasUnsavedChanges]);

  const attractionToDayMap = useMemo(() => {
    const map = new Map<number, ItineraryDayData>();
    itineraryDays.forEach((day) => {
      day.attractions.forEach((attraction) => {
        map.set(attraction.id, day);
      });
    });
    return map;
  }, [itineraryDays]);

  const createDay = api.itinerary.createItineraryDay.useMutation({
    onMutate: async (newDayData) => {
      // Cancel any in-flight queries
      await utils.trip.getWithItinerary.cancel();

      // Snapshot current state
      const previousDays = [...itineraryDays];

      // For better UI optimistically add the new day instantly with a temp ID to avoid conflicts
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

      return { previousDays, tempId };
    },
    onSuccess: (newDay, _, context) => {
      // Replace temp ID with real ID from server
      setItineraryDays((prev) =>
        prev.map((day) =>
          day.id === context.tempId ? { ...day, id: newDay.id } : day,
        ),
      );
      setSelectedDay(newDay.id);
      toast.success("Day added successfully", {
        description: `${newDay.name} has been added to your itinerary.`,
      });
      void utils.trip.invalidate();
    },
    onError: (err, _, context) => {
      // Rollback optimistic update
      if (context) {
        setItineraryDays(context.previousDays);
        setSelectedDay(context.previousDays[0]?.id ?? null);
      }
      toast.error("Failed to add day", {
        description: err.message || "Please try again.",
      });
    },
  });

  const deleteDay = api.itinerary.deleteItineraryDay.useMutation({
    onSuccess: async (_, variables) => {
      const prevDays = itineraryDays;
      setItineraryDays((prevDays) => {
        const filtered = prevDays.filter((d) => d.id !== variables.dayId);
        return filtered.map((d, i) => ({ ...d, dayNumber: i + 1 }));
      });

      // Update selection after state update
      setSelectedDay((prev) =>
        prev === variables.dayId ? (prevDays[0]?.id ?? null) : prev,
      );

      // Check if reordering is needed
      const filtered = prevDays.filter((d) => d.id !== variables.dayId);
      const needsReorder = filtered.some((d, i) => d.dayNumber !== i + 1);

      if (needsReorder && filtered.length > 0) {
        const reordered = filtered.map((d, i) => ({
          ...d,
          dayNumber: i + 1,
        }));

        updateDays.mutate(
          {
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
          },
          {
            onError: (err) => {
              toast.error("Failed to reorder remaining days", {
                description:
                  err.message || "The day was deleted but reordering failed.",
              });
            },
          },
        );
      }
      toast.success("Day removed");
      void utils.trip.invalidate();
    },
    onSettled: () => setDayBeingRemoved(null),
    onError: (err) => {
      toast.error("Failed to remove day", {
        description: err.message || "Please try again.",
      });
    },
  });

  const updateDays = api.itinerary.updateItineraryDays.useMutation({
    onSuccess: () => {
      toast.success("Itinerary saved");
      void utils.trip.invalidate();
    },
    onError: (err) => {
      toast.error("Failed to save itinerary", {
        description: err.message || "Please try again.",
      });
    },
  });

  // Handlers
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

  const handleAttractionClick = useCallback(
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

      toast.success("Attraction added", {
        description: `${attraction.name} has been added.`,
      });
    },
    [selectedDay, attractionToDayMap],
  );

  const handleRemoveAttraction = useCallback(
    (dayId: number, attractionId: number) => {
      setItineraryDays((prev) =>
        prev.map((d) =>
          d.id === dayId
            ? {
                ...d,
                attractions: d.attractions.filter((a) => a.id !== attractionId),
              }
            : d,
        ),
      );
    },
    [],
  );

  const handleSave = useCallback(async () => {
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

  return (
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
            <p className="mb-4 text-gray-600">No days in your itinerary yet.</p>
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
                onRemoveAttraction={handleRemoveAttraction}
                onAttractionHover={setHoveredAttraction}
                isRemoving={dayBeingRemoved === day.id}
                isDragging={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
        {/* <ItineraryMap
          attractions={attractions}
          selectedDayAttractions={
            itineraryDays.find((d) => d.id === selectedDay)?.attractions ?? []
          }
          selectedDayId={selectedDay}
          allDaysAttractions={allDaysAttractions}
          dayColors={dayColors}
          hoveredAttractionId={hoveredAttraction}
          onAttractionClick={handleAttractionClick}
        /> */}
      </div>
    </div>
  );
}
