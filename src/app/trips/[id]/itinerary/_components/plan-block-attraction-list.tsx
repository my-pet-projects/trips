"use client";

import { Car, Clock, Footprints, GripVertical, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/app/_components/ui/tooltip";
import type { PlanBlock, RouteData } from "~/types";

type PlanBlockAttractionListProps = {
  attractions: PlanBlock["attractions"];
  color: string;
  selectedAttractionId: number | null;
  routeLegs?: RouteData["legs"];
  onSelectAttraction: (attractionId: number) => void;
  onHoverAttraction: (attractionId: number | null) => void;
  onRemoveAttraction: (attractionId: number) => void;
  onReorder: (reordered: PlanBlock["attractions"]) => void;
};

export function PlanBlockAttractionList({
  attractions,
  color,
  selectedAttractionId,
  routeLegs,
  onSelectAttraction,
  onHoverAttraction,
  onRemoveAttraction,
  onReorder,
}: PlanBlockAttractionListProps) {
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const removeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [removingAttractionId, setRemovingAttractionId] = useState<
    number | null
  >(null);
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    return () => {
      if (removeTimeoutRef.current) {
        clearTimeout(removeTimeoutRef.current);
      }
    };
  }, []);

  const handleRemove = (e: React.MouseEvent, attractionId: number) => {
    e.stopPropagation();
    if (removeTimeoutRef.current) {
      clearTimeout(removeTimeoutRef.current);
    }
    setRemovingAttractionId(attractionId);
    removeTimeoutRef.current = setTimeout(() => {
      removeTimeoutRef.current = null;
      onRemoveAttraction(attractionId);
      setRemovingAttractionId(null);
    }, 300);
  };

  const handleClick = (e: React.MouseEvent, attractionId: number) => {
    e.stopPropagation();
    onSelectAttraction(attractionId);
  };

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    const target = e.target as HTMLElement;
    if (!target.closest(".attraction-drag-handle")) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    const rowNode = rowRefs.current[index];
    if (rowNode) {
      const rect = rowNode.getBoundingClientRect();
      e.dataTransfer.setDragImage(
        rowNode,
        e.clientX - rect.left,
        e.clientY - rect.top,
      );
    }
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  }, []);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    setIsReordering(true);
    const updated = [...attractions];
    const [item] = updated.splice(draggedIndex, 1);
    if (!item) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setIsReordering(false);
      return;
    }
    updated.splice(dropIndex, 0, item);
    onReorder(updated);
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
    <div className={`space-y-2 ${isReordering ? "pointer-events-none" : ""}`}>
      {attractions.map((attraction, index) => {
        const isSelected = selectedAttractionId === attraction.id;
        const isDragging = draggedIndex === index;
        const isDragOver = dragOverIndex === index;
        const isRemoving = removingAttractionId === attraction.id;
        const nextAttraction = attractions[index + 1];
        const legToNext = nextAttraction
          ? routeLegs?.find(
              (leg) =>
                leg.fromAttractionId === attraction.id &&
                leg.toAttractionId === nextAttraction.id,
            )
          : undefined;
        const TravelModeIcon =
          legToNext?.travelMode === "driving" ? Car : Footprints;

        return (
          <div key={attraction.id}>
            <div
              ref={(el) => {
                rowRefs.current[index] = el;
              }}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={(e) => handleDrop(e, index)}
              className={`group/item flex items-start gap-2 rounded-lg border p-2.5 transition-all duration-300 ${
                isSelected
                  ? "border-blue-400 bg-blue-50 shadow-md ring-2 ring-blue-200"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white hover:shadow-sm"
              } ${
                isDragging
                  ? "scale-[0.98] border-dashed border-blue-400 opacity-50 shadow-xl"
                  : ""
              } ${isDragOver ? "scale-[1.02] border-blue-400 bg-blue-100 shadow-md" : ""} ${
                isRemoving ? "scale-90 opacity-0 blur-sm" : ""
              }`}
              onMouseEnter={() =>
                !isDragging && onHoverAttraction(attraction.id)
              }
              onMouseLeave={() => onHoverAttraction(null)}
              onClick={(e) => handleClick(e, attraction.id)}
            >
              <Tooltip>
                <TooltipTrigger
                  type="button"
                  aria-label="Drag to reorder"
                  className={`attraction-drag-handle cursor-grab rounded p-1 transition-all hover:bg-gray-200 ${
                    isDragging ? "cursor-grabbing" : ""
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <GripVertical className="h-4 w-4 text-gray-400 transition-colors group-hover/item:text-gray-600" />
                </TooltipTrigger>
                <TooltipContent>Drag to reorder</TooltipContent>
              </Tooltip>

              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-md ring-2 ring-white transition-transform group-hover/item:scale-110"
                style={{ backgroundColor: color }}
              >
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 transition-colors group-hover/item:text-gray-950">
                  {attraction.name}
                </p>
              </div>

              <Tooltip>
                <TooltipTrigger
                  type="button"
                  aria-label="Remove attraction"
                  onClick={(e) => handleRemove(e, attraction.id)}
                  className="shrink-0 rounded-lg p-1 text-gray-400 opacity-0 transition-all group-hover/item:opacity-100 hover:bg-red-50 hover:text-red-600 hover:shadow-sm active:scale-90"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent>Remove attraction</TooltipContent>
              </Tooltip>
            </div>

            {legToNext && index < attractions.length - 1 && (
              <div className="ml-4 flex items-center gap-2 py-1.5 pl-3 text-xs text-gray-500">
                <div className="flex h-6 w-0.5 bg-linear-to-b from-gray-300 to-transparent" />
                <div className="flex items-center gap-2 rounded-md bg-gray-100 px-2 py-1">
                  <TravelModeIcon className="h-3 w-3" />
                  <span>
                    {legToNext.travelMode === "driving" ? "Driving" : "Walking"}
                  </span>
                  <span>{(legToNext.distanceMeters / 1000).toFixed(1)} km</span>
                  <span className="text-gray-400">•</span>
                  <Clock className="h-3 w-3" />
                  <span>{Math.round(legToNext.durationSeconds / 60)} min</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
