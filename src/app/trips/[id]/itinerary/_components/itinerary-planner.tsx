"use client";

import { AlertCircle, Loader2, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { ItineraryMap } from "~/app/_components/map/itinerary-map";
import { useItineraryDayMaps } from "~/lib/itinerary/use-itinerary-day-maps";
import { useItineraryEditor } from "~/lib/itinerary/use-itinerary-editor";
import type { AttractionDetail, Trip } from "~/types";
import { ItineraryDay } from "./itinerary-day";
import { ItineraryAllDaysPdfButton } from "./itinerary-pdf-export-button";

type ItineraryPlannerProps = {
  trip: Trip;
  tripAttractions: AttractionDetail[];
};

export function ItineraryPlanner({
  trip,
  tripAttractions: attractions,
}: ItineraryPlannerProps) {
  const [hoveredAttraction, setHoveredAttraction] = useState<number | null>(
    null,
  );
  const [selectedAttractionId, setSelectedAttractionId] = useState<
    number | null
  >(null);

  const {
    itineraryDays,
    selectedDayId,
    setSelectedDayId,
    isSaving,
    isAddingDay,
    dayBeingRemoved,
    saveError,
    addDay,
    removeDay,
    retrySave,
    addAttractionToDay,
    removeAttraction,
    reorderAttractions,
    moveDay,
  } = useItineraryEditor(trip);

  const { allDaysAttractions, dayColors, attractionToDayMap } =
    useItineraryDayMaps(itineraryDays);

  const handleSelectAttraction = useCallback(
    (attractionId: number | null) => {
      setSelectedAttractionId(attractionId);
      if (attractionId === null) return;
      const day = attractionToDayMap.get(attractionId);
      if (day) setSelectedDayId(day.id);
    },
    [attractionToDayMap],
  );

  const selectedDayAttractions = useMemo(
    () =>
      itineraryDays.find((d) => d.id === selectedDayId)?.attractions ?? [],
    [itineraryDays, selectedDayId],
  );

  const handleAddAttractionToDay = (attraction: AttractionDetail) => {
    if (addAttractionToDay(selectedDayId, attraction)) {
      setSelectedAttractionId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Daily Itinerary
            </h2>
            {isSaving && (
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <ItineraryAllDaysPdfButton
              days={itineraryDays}
              tripName={trip.name}
              dayColors={dayColors}
              disabled={itineraryDays.every((d) => d.attractions.length === 0)}
            />
            <button
              type="button"
              onClick={addDay}
              disabled={isAddingDay}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {isAddingDay ? "Adding..." : "Add Day"}
            </button>
          </div>
        </div>

        {saveError && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Could not save changes: {saveError}</span>
            </div>
            <button
              type="button"
              onClick={retrySave}
              disabled={isSaving}
              className="shrink-0 rounded-md bg-red-100 px-3 py-1.5 font-medium text-red-800 transition-colors hover:bg-red-200 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Retry"}
            </button>
          </div>
        )}

        {itineraryDays.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="mb-4 text-gray-600">No days in your itinerary yet.</p>
            <button
              type="button"
              onClick={addDay}
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
                index={index}
                isSelected={selectedDayId === day.id}
                isRemoving={dayBeingRemoved === day.id}
                selectedAttractionId={selectedAttractionId}
                onSelectDay={setSelectedDayId}
                onSelectAttraction={handleSelectAttraction}
                onHoverAttraction={setHoveredAttraction}
                removeDay={removeDay}
                removeAttraction={removeAttraction}
                reorderAttractions={reorderAttractions}
                moveDay={moveDay}
              />
            ))}
          </div>
        )}
      </div>

      <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
        <ItineraryMap
          attractions={attractions}
          selectedDayAttractions={selectedDayAttractions}
          selectedDayId={selectedDayId}
          selectedAttractionId={selectedAttractionId}
          allDaysAttractions={allDaysAttractions}
          dayColors={dayColors}
          hoveredAttractionId={hoveredAttraction}
          itineraryDays={itineraryDays}
          onAttractionSelect={handleSelectAttraction}
          onAddAttractionToDay={handleAddAttractionToDay}
          tripsImageSource="map-itinerary"
        />
      </div>
    </div>
  );
}
