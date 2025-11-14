"use client";

import { GripVertical, MapPin, Trash2 } from "lucide-react";
import type { RouterOutputs } from "~/trpc/react";

type Trip = RouterOutputs["trip"]["getWithItinerary"];
type BasicAttraction =
  Trip["itineraryDays"][number]["itineraryDayPlaces"][number]["attraction"];

type ItineraryDay = {
  id: number;
  name: string;
  dayNumber: number;
  attractions: BasicAttraction[];
};

type ItineraryDayProps = {
  day: ItineraryDay;
  color: string;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onRemoveAttraction: (dayId: number, attractionId: number) => void;
  onAttractionHover: (id: number | null) => void;
  isDragging?: boolean;
  isRemoving?: boolean;
};

export function ItineraryDay({
  day,
  color,
  isSelected,
  onSelect,
  onRemove,
  onRemoveAttraction,
  onAttractionHover,
  isDragging = false,
  isRemoving = false,
}: ItineraryDayProps) {
  const attractionCount = day.attractions.length;

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
  };

  const handleRemoveAttraction = (
    e: React.MouseEvent,
    attractionId: number,
  ) => {
    e.stopPropagation();
    onRemoveAttraction(day.id, attractionId);
  };

  return (
    <div
      onClick={onSelect}
      className={`w-full cursor-pointer rounded-lg border-2 bg-white p-4 transition-all ${
        isSelected
          ? "shadow-lg"
          : "border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md"
      } ${isDragging ? "-translate-y-1 opacity-75 shadow-xl" : ""} ${
        isRemoving ? "pointer-events-none opacity-80 grayscale" : ""
      }`}
      style={isSelected ? { borderColor: color } : {}}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <GripVertical className="h-5 w-5 shrink-0 text-gray-500" />
          <div
            className="h-4 w-4 shrink-0 rounded-full border border-gray-200 shadow-sm"
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
          {attractionCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              <MapPin className="h-3 w-3" />
              {attractionCount}
            </span>
          )}
          <button
            type="button"
            onClick={handleRemoveClick}
            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
            disabled={isRemoving}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Attractions List */}
      {attractionCount === 0 ? (
        <p className="text-sm text-gray-400 italic">
          Click attractions on the map to add them
        </p>
      ) : (
        <div className="space-y-2">
          {day.attractions.map((attraction, index) => (
            <div
              key={attraction.id}
              className="group flex items-start gap-2 rounded-lg border border-gray-100 bg-gray-50 p-2.5 transition-all hover:-translate-y-0.5 hover:border-gray-200 hover:bg-white hover:shadow-md"
              onMouseEnter={() => onAttractionHover(attraction.id)}
              onMouseLeave={() => onAttractionHover(null)}
            >
              {/* Order Number */}
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white shadow-sm ring-1 ring-white/30"
                style={{ backgroundColor: color }}
              >
                {index + 1}
              </span>

              {/* Attraction Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {attraction.name}
                </p>
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={(e) => handleRemoveAttraction(e, attraction.id)}
                className="shrink-0 rounded p-1 text-gray-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 focus:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
