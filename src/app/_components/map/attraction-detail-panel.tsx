"use client";

import {
  BookOpen,
  Images,
  MapPin,
  Pencil,
  SkipForward,
  Star,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { AttractionDetail } from "~/types";
import { AttractionImageGallery } from "./attraction-image-gallery";

type Highlight = "must_see" | "recommended" | "skip" | null;

type AttractionDetailPanelProps = {
  attraction: AttractionDetail;
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
  onHighlightChange?: (attractionId: number, highlight: Highlight) => void;
  onDelete?: (attractionId: number) => void;
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
  onHighlightChange,
  onDelete,
}: AttractionDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [highlight, setHighlight] = useState<Highlight>(
    attraction.highlight ?? null,
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setHighlight(attraction.highlight ?? null);
    setConfirmDelete(false);
  }, [attraction.id, attraction.highlight]);

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
    return () => resizeObserver.disconnect();
  }, [onPanelHeightChange, isOpen]);

  const handleHighlight = (value: Highlight) => {
    const next = highlight === value ? null : value;
    setHighlight(next);
    onHighlightChange?.(attraction.id, next);
  };

  const mapsUrl =
    attraction.latitude != null && attraction.longitude != null
      ? `https://www.google.com/maps?q=${attraction.latitude},${attraction.longitude}`
      : null;
  const imagesUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${attraction.nameLocal ?? attraction.name} ${attraction.city.name}`).trim()}`;
  const sourceDomain = attraction.sourceUrl
    ? (() => {
        try {
          return new URL(attraction.sourceUrl).hostname.replace(/^www\./, "");
        } catch {
          return attraction.sourceUrl;
        }
      })()
    : null;

  return (
    <div
      ref={panelRef}
      data-testid="map-detail-panel"
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

        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg leading-tight font-semibold text-gray-900">
                {attraction.name}
              </h3>
              {attraction.nameLocal &&
                attraction.nameLocal !== attraction.name && (
                  <p className="text-sm leading-tight text-gray-500">
                    {attraction.nameLocal}
                  </p>
                )}
              <p className="mt-0.5 text-sm leading-tight text-gray-400">
                {attraction.city.name}, {attraction.city.country.name}
              </p>
            </div>
          </div>

          {/* Right-side controls */}
          <div className="mt-0.5 flex shrink-0 items-center">
            <div className="flex items-center gap-0.5">
              <Link
                href={`/attractions/${attraction.id}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Edit attraction"
              >
                <Pencil className="h-4 w-4" />
              </Link>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500"
                  aria-label="Delete attraction"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="mx-2 h-5 w-px bg-gray-200" />
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gray-100 p-1.5 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Highlight buttons */}
        {onHighlightChange && (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => handleHighlight("must_see")}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                highlight === "must_see"
                  ? "border-amber-400 bg-amber-50 text-amber-700"
                  : "border-gray-200 text-gray-500 hover:border-amber-300 hover:bg-amber-50/50"
              }`}
            >
              <Star className="h-3.5 w-3.5" />
              Must see
            </button>
            <button
              type="button"
              onClick={() => handleHighlight("recommended")}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                highlight === "recommended"
                  ? "border-teal-400 bg-teal-50 text-teal-700"
                  : "border-gray-200 text-gray-500 hover:border-teal-300 hover:bg-teal-50/50"
              }`}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              Recommended
            </button>
            <button
              type="button"
              onClick={() => handleHighlight("skip")}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                highlight === "skip"
                  ? "border-red-300 bg-red-50 text-red-600"
                  : "border-gray-200 text-gray-500 hover:border-red-200 hover:bg-red-50/50"
              }`}
            >
              <SkipForward className="h-3.5 w-3.5" />
              Skip
            </button>
          </div>
        )}
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto px-4 pb-4">
        {confirmDelete ? (
          <div className="mt-4 flex flex-col items-center gap-4 rounded-xl border border-red-100 bg-red-50 p-6 text-center">
            <div className="rounded-full bg-red-100 p-3">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                Delete &ldquo;{attraction.name}&rdquo;?
              </p>
              <p className="mt-1 text-sm text-gray-500">
                This will permanently remove the attraction from the database.
              </p>
            </div>
            <div className="flex w-full gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { onDelete!(attraction.id); setConfirmDelete(false); }}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <>
            {attraction.description && (
              <div className="mt-4 mb-4 rounded-lg bg-gray-50 p-3">
                <p className="text-sm leading-relaxed text-gray-700">
                  {attraction.description}
                </p>
              </div>
            )}

            {/* Links */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Maps
                </a>
              )}
              {sourceDomain && (
                <a
                  href={attraction.sourceUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  {sourceDomain}
                </a>
              )}
              <a
                href={imagesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800"
              >
                <Images className="h-3.5 w-3.5" />
                Google Images
              </a>
            </div>

            <AttractionImageGallery attraction={attraction} />

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
          </>
        )}
      </div>
    </div>
  );
}
