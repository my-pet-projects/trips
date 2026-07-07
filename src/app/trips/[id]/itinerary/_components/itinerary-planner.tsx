"use client";

import { AlertCircle, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { ItineraryMap } from "~/app/_components/map/itinerary-map";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "~/app/_components/ui/alert";
import { Button } from "~/app/_components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "~/app/_components/ui/empty";
import { Spinner } from "~/app/_components/ui/spinner";
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
                <Spinner className="h-3.5 w-3.5" />
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
            <Button
              type="button"
              variant="outline"
              onClick={addDay}
              disabled={isAddingDay}
            >
              <Plus className="h-4 w-4" />
              {isAddingDay ? "Adding..." : "Add Day"}
            </Button>
          </div>
        </div>

        {saveError && (
          <Alert
            variant="destructive"
            className="flex items-center justify-between gap-3 border-red-200 bg-red-50 px-4 py-3 [&>svg]:text-red-600"
          >
            <div className="flex min-w-0 items-start gap-2">
              <AlertCircle />
              <div>
                <AlertTitle className="text-red-900">Could not save changes</AlertTitle>
                <AlertDescription className="text-red-800">{saveError}</AlertDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={retrySave}
              disabled={isSaving}
              className="shrink-0 bg-red-100 text-red-800 hover:bg-red-200"
            >
              {isSaving ? "Saving..." : "Retry"}
            </Button>
          </Alert>
        )}

        {itineraryDays.length === 0 ? (
          <Empty className="border-gray-200 bg-gray-50">
            <EmptyHeader>
              <EmptyTitle>No days in your itinerary yet</EmptyTitle>
              <EmptyDescription>
                Add your first day to start planning attractions on the map.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={addDay}>
                <Plus className="h-4 w-4" />
                Add First Day
              </Button>
            </EmptyContent>
          </Empty>
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
