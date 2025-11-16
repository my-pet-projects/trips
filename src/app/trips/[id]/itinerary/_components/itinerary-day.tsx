"use client";

import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  MapPin,
  Trash2,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
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
  onReorderAttractions: (
    dayId: number,
    reorderedAttractions: BasicAttraction[],
  ) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAttractionHover: (id: number | null) => void;
  onAttractionClick: (attractionId: number) => void;
  selectedAttractionId?: number | null;
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
  onReorderAttractions,
  onMoveUp,
  onMoveDown,
  onAttractionHover,
  onAttractionClick,
  selectedAttractionId,
  isDragging = false,
  isRemoving = false,
}: ItineraryDayProps) {
  const attractionCount = day.attractions.length;

  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [removingAttractionId, setRemovingAttractionId] = useState<
    number | null
  >(null);
  const [isReordering, setIsReordering] = useState(false);

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
  };

  const handleRemoveAttraction = (
    e: React.MouseEvent,
    attractionId: number,
  ) => {
    e.stopPropagation();
    setRemovingAttractionId(attractionId);
    // Delay the actual removal to show animation
    setTimeout(() => {
      onRemoveAttraction(day.id, attractionId);
      setRemovingAttractionId(null);
    }, 300);
  };

  const handleAttractionClick = (e: React.MouseEvent, attractionId: number) => {
    e.stopPropagation();
    onAttractionClick(attractionId);
  };

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    const target = e.target as HTMLElement;

    // Only allow drag from handle
    if (!target.closest(".attraction-drag-handle")) {
      e.preventDefault();
      return;
    }

    setDraggedIndex(index);

    // Use the stored row ref for this index
    const rowNode = rowRefs.current[index];
    if (rowNode) {
      const rect = rowNode.getBoundingClientRect();
      // Anchor the preview to the pointer location (so it doesn't jump to center)
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      e.dataTransfer.setDragImage(rowNode, offsetX, offsetY);
    }

    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  }, []);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setIsReordering(true);

    const updated = [...day.attractions];
    const [item] = updated.splice(draggedIndex, 1);
    if (!item) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setIsReordering(false);
      return;
    }
    updated.splice(dropIndex, 0, item);

    onReorderAttractions(day.id, updated);

    setTimeout(() => {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setIsReordering(false);
    }, 300);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div
      onClick={onSelect}
      className={`group/card w-full cursor-pointer rounded-xl border-2 bg-white p-4 transition-all duration-300 ${
        isSelected
          ? "ring-opacity-20 shadow-lg ring-2"
          : "border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md"
      } ${isDragging ? "-translate-y-1 scale-[0.98] opacity-75 shadow-xl" : ""} ${
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
      {/* Header */}
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
                onMoveUp();
              }}
              disabled={day.dayNumber === 1 || isRemoving}
              className="group/btn flex items-center justify-center px-2 py-1.5 text-gray-600 transition-all hover:bg-blue-50 hover:text-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-600"
              title="Move day up"
            >
              <ChevronUp className="group-hover/btn:not([disabled]):-translate-y-0.5 h-4 w-4 transition-transform" />
            </button>
            <div className="h-full w-px bg-gray-300" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              disabled={isRemoving}
              className="group/btn flex items-center justify-center px-2 py-1.5 text-gray-600 transition-all hover:bg-blue-50 hover:text-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-600"
              title="Move day down"
            >
              <ChevronDown className="group-hover/btn:not([disabled]):translate-y-0.5 h-4 w-4 transition-transform" />
            </button>
          </div>
          {attractionCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-linear-to-br from-gray-100 to-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-gray-300/50 transition-transform group-hover/card:scale-105">
              <MapPin className="h-3 w-3" />
              {attractionCount}
            </span>
          )}
          <button
            type="button"
            onClick={handleRemoveClick}
            className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-red-50 hover:text-red-600 hover:shadow-sm active:scale-95"
            disabled={isRemoving}
            title="Remove day"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Attractions List */}
      {attractionCount === 0 ? (
        <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 py-8 transition-colors group-hover/card:border-gray-300 group-hover/card:bg-gray-100">
          <p className="text-sm text-gray-400 italic">
            Click attractions on the map to add them
          </p>
        </div>
      ) : (
        <div
          className={`space-y-2 ${isReordering ? "pointer-events-none" : ""}`}
        >
          {day.attractions.map((attraction, index) => {
            const isSelectedAttr = selectedAttractionId === attraction.id;
            const isDraggingThis = draggedIndex === index;
            const isDragOver = dragOverIndex === index;
            const isRemoving = removingAttractionId === attraction.id;

            return (
              <div
                key={attraction.id}
                ref={(el) => {
                  rowRefs.current[index] = el;
                }}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={`group/item flex items-start gap-2 rounded-lg border p-2.5 transition-all duration-300 ${
                  isSelectedAttr
                    ? "border-blue-400 bg-blue-50 shadow-md ring-2 ring-blue-200"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white hover:shadow-sm"
                } ${
                  isDraggingThis
                    ? "scale-[0.98] border-dashed border-blue-400 opacity-50 shadow-xl"
                    : ""
                } ${isDragOver ? "scale-[1.02] border-blue-400 bg-blue-100 shadow-md" : ""} ${
                  isRemoving ? "scale-90 opacity-0 blur-sm" : ""
                }`}
                onMouseEnter={() =>
                  !isDraggingThis && onAttractionHover(attraction.id)
                }
                onMouseLeave={() => onAttractionHover(null)}
                onClick={(e) => handleAttractionClick(e, attraction.id)}
              >
                {/* Drag Handle */}
                <button
                  type="button"
                  className={`attraction-drag-handle cursor-grab rounded p-1 transition-all hover:bg-gray-200 ${
                    isDraggingThis ? "cursor-grabbing" : ""
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  title="Drag to reorder"
                >
                  <GripVertical className="h-4 w-4 text-gray-400 transition-colors group-hover/item:text-gray-600" />
                </button>

                {/* Order Number */}
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-md ring-2 ring-white transition-transform group-hover/item:scale-110"
                  style={{ backgroundColor: color }}
                >
                  {index + 1}
                </span>
                {/* Attraction Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 transition-colors group-hover/item:text-gray-950">
                    {attraction.name}
                  </p>
                </div>
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={(e) => handleRemoveAttraction(e, attraction.id)}
                  className="shrink-0 rounded-lg p-1 text-gray-400 opacity-0 transition-all group-hover/item:opacity-100 hover:bg-red-50 hover:text-red-600 hover:shadow-sm active:scale-90"
                  title="Remove attraction"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
