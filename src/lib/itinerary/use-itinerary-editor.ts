import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { getTrpcErrorMessage } from "~/lib/trpc-error-message";
import { api } from "~/trpc/react";
import type { AttractionDetail, ItineraryDayData, Trip } from "~/types";

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

export function useItineraryEditor(trip: Trip) {
  const tripId = trip.id;
  const utils = api.useUtils();

  const [itineraryDays, setItineraryDays] = useState<ItineraryDayData[]>(
    () => trip.itineraryDays,
  );
  const [selectedDayId, setSelectedDayId] = useState<number | null>(
    () => trip.itineraryDays[0]?.id ?? null,
  );
  const [dayBeingRemoved, setDayBeingRemoved] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const dayIdsKey = useMemo(
    () => itineraryDays.map((day) => day.id).join(","),
    [itineraryDays],
  );

  useEffect(() => {
    setSelectedDayId((prev) =>
      prev !== null && itineraryDays.some((day) => day.id === prev)
        ? prev
        : (itineraryDays[0]?.id ?? null),
    );
  }, [dayIdsKey, itineraryDays]);

  const lastSavedSnapshot = useRef(serializeItineraryDays(itineraryDays));
  const skipNextSave = useRef(true);
  const prevTripIdRef = useRef(tripId);
  const cancelledTempIds = useRef(new Set<number>());
  const silentDeleteIds = useRef(new Set<number>());
  const itineraryDaysRef = useRef(itineraryDays);
  itineraryDaysRef.current = itineraryDays;

  const updateDays = api.itinerary.updateItineraryDays.useMutation({
    onSuccess: (_, variables) => {
      lastSavedSnapshot.current = serializeItineraryUpdatePayload(
        variables.days,
      );
      setSaveError(null);
      void utils.trip.invalidate();
    },
    onError: (err) => {
      const message = getTrpcErrorMessage(err);
      setSaveError((prev) => {
        if (!prev) {
          toast.error("Could not save changes", { description: message });
        }
        return message;
      });
    },
  });

  const deleteDay = api.itinerary.deleteItineraryDay.useMutation({
    onSuccess: (_, variables) => {
      setItineraryDays((prevDays) => {
        const filtered = prevDays.filter((d) => d.id !== variables.dayId);
        return filtered.map((d, i) => ({ ...d, dayNumber: i + 1 }));
      });

      const isSilent = silentDeleteIds.current.delete(variables.dayId);
      if (!isSilent) {
        toast.success("Day removed");
      }
      void utils.trip.invalidate();
    },
    onError: (err) => {
      toast.error("Failed to remove day", {
        description: getTrpcErrorMessage(err),
      });
    },
    onSettled: () => setDayBeingRemoved(null),
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
      setSelectedDayId(tempId);
      return { tempId };
    },
    onSuccess: (newDay, _, context) => {
      const tempId = context?.tempId;
      if (tempId === undefined) return;

      const wasCancelled = cancelledTempIds.current.delete(tempId);
      const tempStillPresent = itineraryDaysRef.current.some(
        (day) => day.id === tempId,
      );

      if (wasCancelled || !tempStillPresent) {
        silentDeleteIds.current.add(newDay.id);
        deleteDay.mutate({ dayId: newDay.id });
        return;
      }

      setItineraryDays((prev) =>
        prev.map((day) =>
          day.id === tempId ? { ...day, id: newDay.id } : day,
        ),
      );
      setSelectedDayId(newDay.id);
      toast.success("Day added successfully");
      void utils.trip.invalidate();
    },
    onError: (err, _, context) => {
      if (context?.tempId) {
        cancelledTempIds.current.delete(context.tempId);
        setItineraryDays((prev) =>
          prev.filter((day) => day.id !== context.tempId),
        );
      }
      toast.error("Failed to add day", {
        description: getTrpcErrorMessage(err),
      });
    },
  });

  useEffect(() => {
    if (prevTripIdRef.current === tripId) return;
    prevTripIdRef.current = tripId;

    const serverDays = trip.itineraryDays;
    setItineraryDays(serverDays);
    skipNextSave.current = true;
    lastSavedSnapshot.current = serializeItineraryDays(serverDays);
  }, [tripId, trip]);

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
    if (createDay.isPending) return;

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
        cancelledTempIds.current.add(dayId);
        setItineraryDays((prev) => prev.filter((d) => d.id !== dayId));
        return;
      }

      setDayBeingRemoved(dayId);
      deleteDay.mutate({ dayId });
    },
    [deleteDay],
  );

  const retrySave = useCallback(() => {
    if (itineraryDays.some((day) => day.id < 0)) {
      return;
    }
    updateDays.mutate(toItineraryUpdateInput(tripId, itineraryDays));
  }, [itineraryDays, tripId, updateDays]);

  const addAttractionToDay = useCallback(
    (dayId: number | null, attraction: AttractionDetail): boolean => {
      if (!dayId) {
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
          d.id === dayId
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
    selectedDayId,
    setSelectedDayId,
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
