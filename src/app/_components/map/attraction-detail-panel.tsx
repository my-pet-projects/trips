"use client";

import { MapPin, Pencil, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { Attraction } from "~/types";
import { AttractionImageGallery } from "./attraction-image-gallery";

type AttractionDetailPanelProps = {
  attraction: Attraction;
  attractionStatus: {
    dayId: number | undefined;
    isInAnyDay: boolean;
    isInSelectedDay: boolean;
  };
  selectedDayId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onClosed: () => void;
  onAddToDay?: () => void;
  onPanelHeightChange?: (height: number) => void;
};

export function AttractionDetailPanel({
  attraction,
  attractionStatus,
  selectedDayId,
  isOpen,
  onClose,
  onClosed,
  onAddToDay,
  onPanelHeightChange,
}: AttractionDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(onClosed, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClosed]);

  // Track panel height for map padding — only while open
  useEffect(() => {
    if (!panelRef.current || !onPanelHeightChange || !isOpen) {
      onPanelHeightChange?.(0);
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) onPanelHeightChange(entry.contentRect.height);
    });

    resizeObserver.observe(panelRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, [onPanelHeightChange, isOpen]);

  return (
    <div
      ref={panelRef}
      className={`absolute inset-x-[2.5%] bottom-0 z-1000 flex max-h-[70%] flex-col overflow-hidden rounded-t-2xl border border-b-0 border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-out sm:inset-x-[16.67%] ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      {/* Header */}
      <div className="shrink-0 border-b border-gray-100 bg-white px-4 pt-3 pb-3 shadow-sm">
        {/* Drag handle */}
        <div className="mb-3 flex justify-center">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        {/* Header row: icon + name/location + edit + close */}
        <div className="flex items-start justify-between gap-3">
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

          {/* Edit + Close buttons */}
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href={`/attractions/${attraction.id}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Edit attraction"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto px-4 pb-4">
        {/* Description */}
        {attraction.description && (
          <div className="mt-4 mb-4 rounded-lg bg-gray-50 p-3">
            <p className="text-sm leading-relaxed text-gray-700">
              {attraction.description}
            </p>
          </div>
        )}

        {/* Attraction Images */}
        <AttractionImageGallery attraction={attraction} />

        {/* Action buttons */}
        {onAddToDay ? (
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
        ) : (
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
