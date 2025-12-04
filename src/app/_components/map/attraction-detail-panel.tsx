"use client";

import { ExternalLink, MapPin, X } from "lucide-react";
import { useEffect, useRef } from "react";

import type { RouterOutputs } from "~/trpc/react";
import { AttractionImageGallery } from "./attraction-image-gallery";

type Attraction =
  RouterOutputs["attraction"]["getAttractionsByCountries"][number];

type AttractionDetailPanelProps = {
  attraction: Attraction;
  attractionStatus: {
    dayId: number | undefined;
    isInAnyDay: boolean;
    isInSelectedDay: boolean;
  };
  selectedDayId: number | null;
  viewMode: "admin" | "viewer";
  onClose: () => void;
  onAddToDay?: () => void;
  onPanelHeightChange?: (height: number) => void;
};

export function AttractionDetailPanel({
  attraction,
  attractionStatus,
  selectedDayId,
  viewMode,
  onClose,
  onAddToDay,
  onPanelHeightChange,
}: AttractionDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Track panel height for map padding
  useEffect(() => {
    if (!panelRef.current || !onPanelHeightChange) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        onPanelHeightChange(entry.contentRect.height);
      }
    });

    resizeObserver.observe(panelRef.current);
    return () => {
      resizeObserver.disconnect();
      onPanelHeightChange(0);
    };
  }, [onPanelHeightChange]);

  return (
    <div
      ref={panelRef}
      className="absolute right-0 bottom-0 left-0 z-1000 max-h-[60%] overflow-y-auto border-t border-gray-200 bg-white shadow-lg"
    >
      <div className="p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="shrink-0">
              <div className="rounded-full bg-sky-100 px-2 py-1">
                <MapPin className="h-5 w-5 text-sky-600" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg leading-tight font-semibold text-gray-900">
                {attraction.name}
              </h3>
              {attraction.nameLocal &&
                attraction.nameLocal !== attraction.name && (
                  <p className="text-sm leading-tight text-gray-600">
                    {attraction.nameLocal}
                  </p>
                )}
              <p className="mt-1 text-sm leading-tight text-gray-500">
                {attraction.city.name}, {attraction.city.country.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Description */}
        {attraction.description && (
          <div className="mb-4 rounded-lg bg-gray-50 p-3">
            <p className="text-sm leading-relaxed text-gray-700">
              {attraction.description}
            </p>
          </div>
        )}

        {/* Address */}
        {attraction.address && (
          <div className="mb-4">
            <p className="mb-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Address
            </p>
            <p className="text-sm text-gray-700">{attraction.address}</p>
          </div>
        )}

        {/* External Link */}
        {attraction.sourceUrl && (
          <div className="mb-4">
            <a
              href={attraction.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-sky-600 transition-colors hover:text-sky-700"
            >
              View more information
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        {/* Attraction Images */}
        <AttractionImageGallery attraction={attraction} />

        {/* Action buttons */}
        {viewMode === "admin" && onAddToDay && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onAddToDay}
              disabled={!selectedDayId || attractionStatus.isInAnyDay}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                attractionStatus.isInAnyDay || !selectedDayId
                  ? "cursor-not-allowed bg-gray-100 text-gray-400"
                  : "bg-sky-600 text-white hover:bg-sky-700"
              }`}
            >
              {!selectedDayId
                ? "Select a day first"
                : attractionStatus.isInAnyDay
                  ? attractionStatus.isInSelectedDay
                    ? "Already in this day"
                    : "Already in another day"
                  : "Add to Day"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        )}

        {/* Close button */}
        {viewMode === "viewer" && (
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-700"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
