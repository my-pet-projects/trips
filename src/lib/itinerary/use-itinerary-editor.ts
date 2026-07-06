import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { getTrpcErrorMessage } from "~/lib/trpc-error-message";
import { api } from "~/trpc/react";
import type { AttractionDetail, ItineraryDayData, Trip } from "~/types";

import { transformTripDays } from "./transform";

const AUTO_SAVE_DELAY_MS = 500;

function toItineraryUpdateInput(tripId: number, days: ItineraryDayData[]) {
  return {
    tripId,
    days: days
      .filter((day) => day.id > 0)
      .map((day) => ({
        id: day.id,
        name: day.name,
        dayNumber: day.dayNumber,
        attractions: day.attractions.map((attraction, index) => ({
          attractionId: attraction.id,
          order: index + 1,
        })),
      })),
  };
}

function serializeItineraryDays(days: ItineraryDayData[]): string {
  return JSON.stringify(
    days
      .filter((day) => day.id > 0)
      .map((day) => ({
        id: day.id,
        name: day.name,
        dayNumber: day.dayNumber,
        attractionIds: day.attractions.map((a) => a.id),
      })),
  );
}

function serializeItineraryUpdatePayload(
  days: Array<{
    id: number;
    name: string;
    dayNumber: number;
    attractions: Array<{ attractionId: number; order: number }>;
  }>,
): string {
  return JSON.stringify(
    days.map((day) => ({
      id: day.id,
      name: day.name,
      dayNumber: day.dayNumber,
      attractionIds: day.attractions
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((a) => a.attractionId),
    })),
  );
}

type UseItineraryEditorOptions = {
  onDayAdded?: (dayId: number) => void;
  onDayAddFailed?: (
    tempId: number,
    remainingDays: ItineraryDayData[],
  ) => void;
  onDayRemoved?: (
    dayId: number,
    remainingDays: ItineraryDayData[],
  ) => void;
  onDaysReset?: (days: ItineraryDayData[]) => void;
};

export function useItineraryEditor(
  trip: Trip,
  {
    onDayAdded,
    onDayAddFailed,
    onDayRemoved,
    onDaysReset,
  }: UseItineraryEditorOptions = {},
) {
  const tripId = trip.id;
  const utils = api.useUtils();

  const [itineraryDays, setItineraryDays] = useState<ItineraryDayData[]>(() =>
    transformTripDays(trip),
  );
  const [dayBeingRemoved, setDayBeingRemoved] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const lastSavedSnapshot = useRef(serializeItineraryDays(itineraryDays));
  const skipNextSave = useRef(true);
  const prevTripIdRef = useRef(tripId);

  const updateDays = api.itinerary.updateItineraryDays.useMutation({
    onSuccess: (_, variables) => {
      lastSavedSnapshot.current = serializeItineraryUpdatePayload(
        variables.days,
      );
      setSaveError(null);
      void utils.trip.invalidate();
    },
    onError: (err) => {
      setSaveError(getTrpcErrorMessage(err));
    },
  });

  const createDay = api.itinerary.createItineraryDay.useMutation({
    onMutate: async (newDayData) => {
      await utils.trip.getWithItinerary.cancel();

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
      onDayAdded?.(tempId);
      return { tempId };
    },
    onSuccess: (newDay, _, context) => {
      setItineraryDays((prev) =>
        prev.map((day) =>
          day.id === context?.tempId ? { ...day, id: newDay.id } : day,
        ),
      );
      onDayAdded?.(newDay.id);
      toast.success("Day added successfully");
      void utils.trip.invalidate();
    },
    onError: (err, _, context) => {
      if (context?.tempId) {
        setItineraryDays((prev) => {
          const remaining = prev.filter((day) => day.id !== context.tempId);
          onDayAddFailed?.(context.tempId, remaining);
          return remaining;
        });
      }
      toast.error("Failed to add day", {
        description: getTrpcErrorMessage(err),
      });
    },
  });

  const deleteDay = api.itinerary.deleteItineraryDay.useMutation({
    onSuccess: (_, variables) => {
      setItineraryDays((prevDays) => {
        const filtered = prevDays.filter((d) => d.id !== variables.dayId);
        const reordered = filtered.map((d, i) => ({ ...d, dayNumber: i + 1 }));
        onDayRemoved?.(variables.dayId, reordered);
        return reordered;
      });

      toast.success("Day removed");
      void utils.trip.invalidate();
    },
    onError: (err) => {
      toast.error("Failed to remove day", {
        description: getTrpcErrorMessage(err),
      });
    },
    onSettled: () => setDayBeingRemoved(null),
  });

  useEffect(() => {
    if (prevTripIdRef.current === tripId) return;
    prevTripIdRef.current = tripId;

    const serverDays = transformTripDays(trip);
    setItineraryDays(serverDays);
    skipNextSave.current = true;
    lastSavedSnapshot.current = serializeItineraryDays(serverDays);
    onDaysReset?.(serverDays);
  }, [tripId, trip, onDaysReset]);

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    if (itineraryDays.some((day) => day.id < 0)) {
      return;
    }

    const snapshot = serializeItineraryDays(itineraryDays);
    if (snapshot === lastSavedSnapshot.current) {
      return;
    }

    const timeout = setTimeout(() => {
      updateDays.mutate(toItineraryUpdateInput(tripId, itineraryDays));
    }, AUTO_SAVE_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [itineraryDays, tripId, updateDays]);

  const addDay = useCallback(() => {
    const newDayNumber = itineraryDays.length + 1;
    createDay.mutate({
      tripId,
      name: `Day ${newDayNumber}`,
      dayNumber: newDayNumber,
    });
  }, [tripId, itineraryDays.length, createDay]);

  const removeDay = useCallback(
    (dayId: number) => {
      if (dayId < 0) {
        setItineraryDays((prev) => {
          const remaining = prev.filter((d) => d.id !== dayId);
          onDayAddFailed?.(dayId, remaining);
          return remaining;
        });
        return;
      }

      setDayBeingRemoved(dayId);
      deleteDay.mutate({ dayId });
    },
    [deleteDay, onDayAddFailed],
  );

  const retrySave = useCallback(() => {
    if (itineraryDays.some((day) => day.id < 0)) {
      return;
    }
    updateDays.mutate(toItineraryUpdateInput(tripId, itineraryDays));
  }, [itineraryDays, tripId, updateDays]);

  const addAttractionToDay = useCallback(
    (selectedDayId: number | null, attraction: AttractionDetail): boolean => {
      if (!selectedDayId) {
        toast.error("No day selected", {
          description: "Please select a day to add attractions.",
        });
        return false;
      }

      const existingDay = itineraryDays.find((day) =>
        day.attractions.some((a) => a.id === attraction.id),
      );
      if (existingDay) {
        toast.info("Attraction already added", {
          description: `This attraction is already in ${existingDay.name}.`,
        });
        return false;
      }

      setItineraryDays((prev) =>
        prev.map((d) =>
          d.id === selectedDayId
            ? { ...d, attractions: [...d.attractions, attraction] }
            : d,
        ),
      );

      toast.success("Attraction added", {
        description: `${attraction.name} has been added.`,
      });
      return true;
    },
    [itineraryDays],
  );

  const removeAttraction = useCallback(
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

  const reorderAttractions = useCallback(
    (dayId: number, reorderedAttractions: ItineraryDayData["attractions"]) => {
      setItineraryDays((prev) =>
        prev.map((d) =>
          d.id === dayId ? { ...d, attractions: reorderedAttractions } : d,
        ),
      );
    },
    [],
  );

  const moveDay = useCallback((dayId: number, direction: "up" | "down") => {
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
  }, []);

  return {
    itineraryDays,
    isSaving: updateDays.isPending,
    isAddingDay: createDay.isPending,
    dayBeingRemoved,
    saveError,
    addDay,
    removeDay,
    retrySave,
    addAttractionToDay,
    removeAttraction,
    reorderAttractions,
    moveDay,
  };
}
