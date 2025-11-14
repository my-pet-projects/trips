"use client";

import { Plus, Save } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
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
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#14b8a6", // teal
  "#a855f7", // purple
  "#84cc16", // lime
  "#f43f5e", // rose
] as const;

const generateDayColor = (index: number): string => {
  return DAY_COLORS[index % DAY_COLORS.length]!;
};

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

  const utils = api.useUtils();

  const allDaysAttractions = useMemo(() => {
    const map = new Map<number, BasicAttraction[]>();
    itineraryDays.forEach((day) => {
      map.set(day.id, day.attractions);
    });
    return map;
  }, [itineraryDays]);

  const dayColors = useMemo(() => {
    const map = new Map<number, string>();
    itineraryDays.forEach((day, index) => {
      map.set(day.id, generateDayColor(index));
    });
    return map;
  }, [itineraryDays]);

  const createItineraryDayMutation =
    api.itinerary.createItineraryDay.useMutation({
      onSuccess: (newDay) => {
        toast.success("Day added successfully", {
          description: `${newDay.name} has been added to your itinerary.`,
        });
        setItineraryDays((prev) =>
          [
            ...prev,
            {
              id: newDay.id,
              name: newDay.name,
              dayNumber: newDay.dayNumber,
              attractions: [],
            },
          ].sort((a, b) => a.dayNumber - b.dayNumber),
        );
        setSelectedDay(newDay.id);
        void utils.trip.invalidate();
      },
      onError: (err) => {
        toast.error("Failed to add day", {
          description: err.message || "Please try again.",
        });
      },
    });

  const deleteItineraryDayMutation =
    api.itinerary.deleteItineraryDay.useMutation({
      onSuccess: async (_, variables) => {
        const filtered = itineraryDays.filter((d) => d.id !== variables.dayId);
        const reordered = filtered.map((d, i) => ({
          ...d,
          dayNumber: i + 1,
        }));

        setItineraryDays(reordered);

        // Update selectedDay if the deleted day was selected
        if (selectedDay === variables.dayId) {
          setSelectedDay(reordered[0]?.id ?? null);
        }

        // Save the reordered days
        const orderChanged = reordered.some(
          (d, i) =>
            d.id !== itineraryDays[i]?.id ||
            d.dayNumber !== itineraryDays[i]?.dayNumber,
        );
        if (orderChanged) {
          await updateItineraryDaysMutation.mutateAsync({
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

        toast.success("Day removed", {
          description: "Your itinerary has been updated.",
        });

        void utils.trip.invalidate();
      },
      onSettled: () => {
        setDayBeingRemoved(null);
      },
      onError: (err) => {
        toast.error("Failed to remove day", {
          description: err.message || "Please try again.",
        });
      },
    });

  const updateItineraryDaysMutation =
    api.itinerary.updateItineraryDays.useMutation({
      onSuccess: () => {
        toast.success("Itinerary saved", {
          description: "All changes have been saved successfully.",
        });
        void utils.trip.invalidate();
      },
      onError: (err) => {
        toast.error("Failed to save itinerary", {
          description: err.message || "Please try again.",
        });
      },
    });

  const handleAddDay = useCallback(() => {
    const newDayNumber = itineraryDays.length + 1;
    const newDayName = `Day ${newDayNumber}`;

    createItineraryDayMutation.mutate({
      tripId: trip.id,
      name: newDayName,
      dayNumber: newDayNumber,
    });
  }, [trip, itineraryDays.length, createItineraryDayMutation]);

  const handleRemoveDay = useCallback(
    (dayId: number) => {
      setDayBeingRemoved(dayId);
      deleteItineraryDayMutation.mutate({ dayId });
    },
    [deleteItineraryDayMutation],
  );

  const handleAttractionClick = useCallback(
    (attraction: BasicAttraction) => {
      if (!selectedDay) {
        toast.error("No day selected", {
          description: "Please select a day to add attractions.",
        });
        return;
      }

      const existingDay = itineraryDays.find((d) =>
        d.attractions.some((a) => a.id === attraction.id),
      );

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
        description: `${attraction.name} has been added to your day.`,
      });
    },
    [selectedDay, itineraryDays],
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
    const days = itineraryDays.map((day) => ({
      id: day.id,
      name: day.name,
      dayNumber: day.dayNumber,
      attractions: day.attractions.map((attraction, index) => ({
        attractionId: attraction.id,
        order: index + 1,
      })),
    }));

    await updateItineraryDaysMutation.mutateAsync({
      tripId: trip.id,
      days,
    });
  }, [trip, itineraryDays, updateItineraryDaysMutation]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (itineraryDays.length !== trip.itineraryDays.length) return true;

    return itineraryDays.some((day) => {
      const original = trip.itineraryDays.find((d) => d.id === day.id);
      if (!original) return true;

      // Check day metadata
      if (day.name !== original.name || day.dayNumber !== original.dayNumber) {
        return true;
      }

      // Check attractions
      const originalAttractions = original.itineraryDayPlaces
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((p) => p.attractionId);
      const currentAttractions = day.attractions.map((a) => a.id);

      if (originalAttractions.length !== currentAttractions.length) {
        return true;
      }

      return !originalAttractions.every(
        (id, idx) => id === currentAttractions[idx],
      );
    });
  }, [itineraryDays, trip.itineraryDays]);

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
              disabled={createItineraryDayMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {createItineraryDayMutation.isPending ? "Adding..." : "Add Day"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={
                updateItineraryDaysMutation.isPending || !hasUnsavedChanges
              }
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {updateItineraryDaysMutation.isPending ? "Saving..." : "Save"}
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
