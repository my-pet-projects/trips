"use client";

import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Route,
  Trash2,
} from "lucide-react";

import { useDayRoute } from "~/lib/itinerary/use-itinerary-route-map";
import { getItineraryDayColor } from "~/lib/map/colors";
import type { ItineraryDayData } from "~/types";
import { DayAttractionList } from "./day-attraction-list";
import { ItineraryDayPdfButton } from "./itinerary-pdf-export-button";

type ItineraryDayProps = {
  day: ItineraryDayData;
  index: number;
  isSelected: boolean;
  isRemoving: boolean;
  selectedAttractionId: number | null;
  onSelectDay: (dayId: number) => void;
  onSelectAttraction: (attractionId: number) => void;
  onHoverAttraction: (attractionId: number | null) => void;
  removeDay: (dayId: number) => void;
  removeAttraction: (dayId: number, attractionId: number) => void;
  reorderAttractions: (
    dayId: number,
    reorderedAttractions: ItineraryDayData["attractions"],
  ) => void;
  moveDay: (dayId: number, direction: "up" | "down") => void;
};

export function ItineraryDay({
  day,
  index,
  isSelected,
  isRemoving,
  selectedAttractionId,
  onSelectDay,
  onSelectAttraction,
  onHoverAttraction,
  removeDay,
  removeAttraction,
  reorderAttractions,
  moveDay,
}: ItineraryDayProps) {
  const color = getItineraryDayColor(index);

  const { routeData, isLoadingRoute, routeError } = useDayRoute(
    day.id,
    day.attractions,
  );

  const attractionCount = day.attractions.length;

  return (
    <div
      onClick={() => onSelectDay(day.id)}
      className={`group/card w-full cursor-pointer rounded-xl border-2 bg-white p-4 transition-all duration-300 ${
        isSelected
          ? "ring-opacity-20 shadow-lg ring-2"
          : "border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md"
      } ${
        isRemoving
          ? "pointer-events-none scale-95 opacity-50 blur-sm grayscale"
          : ""
      }`}
      style={
        isSelected
          ? ({
              borderColor: color,
              "--tw-ring-color": color,
            } as React.CSSProperties)
          : {}
      }
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div
            className="h-4 w-4 shrink-0 rounded-full border-2 border-white shadow-md ring-1 ring-gray-200 transition-transform group-hover/card:scale-110"
            style={{ backgroundColor: color }}
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-gray-900">
              Day {day.dayNumber}
            </h3>
            {day.name !== `Day ${day.dayNumber}` && (
              <p className="truncate text-sm text-gray-600">{day.name}</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-gray-300 bg-linear-to-b from-white to-gray-50 shadow-sm">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                moveDay(day.id, "up");
              }}
              disabled={day.dayNumber === 1 || isRemoving}
              className="group/btn flex items-center justify-center px-2 py-1.5 text-gray-600 transition-all hover:bg-blue-50 hover:text-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              title="Move day up"
            >
              <ChevronUp className="h-4 w-4 transition-transform" />
            </button>
            <div className="h-full w-px bg-gray-300" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                moveDay(day.id, "down");
              }}
              disabled={isRemoving}
              className="group/btn flex items-center justify-center px-2 py-1.5 text-gray-600 transition-all hover:bg-blue-50 hover:text-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              title="Move day down"
            >
              <ChevronDown className="h-4 w-4 transition-transform" />
            </button>
          </div>
          {attractionCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-linear-to-br from-gray-100 to-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-gray-300/50">
              <MapPin className="h-3 w-3" />
              {attractionCount}
            </span>
          )}
          {attractionCount > 0 && (
            <ItineraryDayPdfButton
              day={day}
              color={color}
              disabled={isRemoving}
            />
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeDay(day.id);
            }}
            className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-red-50 hover:text-red-600 hover:shadow-sm active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={isRemoving}
            title="Remove day"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {attractionCount >= 2 && (
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-linear-to-r from-blue-50 to-sky-50 px-3 py-2 text-xs">
          {isLoadingRoute ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-300 border-t-sky-600" />
              <span className="text-gray-600">Calculating route...</span>
            </>
          ) : routeData ? (
            <>
              <div className="flex items-center gap-1.5 text-gray-700">
                <Route className="h-3.5 w-3.5 text-sky-600" />
                <span className="font-semibold">
                  {routeData.totalKm.toFixed(1)} km
                </span>
              </div>
              <div className="h-3 w-px bg-sky-200" />
              <div className="flex items-center gap-1.5 text-gray-700">
                <Clock className="h-3.5 w-3.5 text-sky-600" />
                <span className="font-semibold">
                  {Math.round(routeData.totalDurationMinutes)} min
                </span>
              </div>
            </>
          ) : routeError ? (
            <div className="flex flex-col gap-0.5 text-amber-600">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="font-medium">Unable to calculate route</span>
              </div>
              <p className="ml-5 text-xs text-amber-700">{routeError}</p>
            </div>
          ) : null}
        </div>
      )}

      {attractionCount === 0 ? (
        <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 py-8 transition-colors group-hover/card:border-gray-300 group-hover/card:bg-gray-100">
          <p className="text-sm text-gray-400 italic">
            Click attractions on the map to add them
          </p>
        </div>
      ) : (
        <DayAttractionList
          attractions={day.attractions}
          color={color}
          selectedAttractionId={selectedAttractionId}
          routeLegs={routeData?.legs}
          onSelectAttraction={onSelectAttraction}
          onHoverAttraction={onHoverAttraction}
          onRemoveAttraction={(id) => removeAttraction(day.id, id)}
          onReorder={(updated) => reorderAttractions(day.id, updated)}
        />
      )}
    </div>
  );
}
