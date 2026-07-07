"use client";

import {
  BookOpen,
  Images,
  MapPin,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { AttractionDetail } from "~/types";
import { HighlightToggleGroup } from "~/app/_components/highlight-toggle-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/app/_components/ui/alert-dialog";
import { Button, buttonVariants } from "~/app/_components/ui/button";
import { Separator } from "~/app/_components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/app/_components/ui/tooltip";
import { cn } from "~/lib/utils";
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
    }

    setIsVisible(false);
    const timer = setTimeout(onClosed, 300);
    return () => clearTimeout(timer);
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
      className={cn(
        "absolute inset-x-[2.5%] bottom-0 z-1000 flex max-h-[70%] flex-col overflow-hidden rounded-t-2xl border border-b-0 border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-out sm:inset-x-[16.67%]",
        isVisible ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="shrink-0 border-b border-gray-100 bg-white px-4 pt-3 pb-3 shadow-sm">
        <div className="mb-3 flex justify-center">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        <div className="flex items-start justify-between gap-3">
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

          <div className="mt-0.5 flex shrink-0 items-center">
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Link
                      href={`/attractions/${attraction.id}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-accent hover:text-gray-600"
                    />
                  }
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit attraction</span>
                </TooltipTrigger>
                <TooltipContent>Edit attraction</TooltipContent>
              </Tooltip>
              {onDelete && (
                <Tooltip>
                  <TooltipTrigger
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex size-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-accent hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete attraction</span>
                  </TooltipTrigger>
                  <TooltipContent>Delete attraction</TooltipContent>
                </Tooltip>
              )}
            </div>
            <Separator orientation="vertical" className="mx-2 h-5" />
            <Tooltip>
              <TooltipTrigger
                type="button"
                onClick={onClose}
                className="inline-flex size-8 items-center justify-center rounded-md bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </TooltipTrigger>
              <TooltipContent>Close</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {onHighlightChange && (
          <HighlightToggleGroup
            value={highlight}
            onChange={(next) => {
              setHighlight(next);
              onHighlightChange(attraction.id, next);
            }}
            compact
            className="mt-3"
          />
        )}
      </div>

      <div className="overflow-y-auto px-4 pb-4">
        {attraction.description && (
          <div className="mt-4 mb-4 rounded-lg bg-gray-50 p-3">
            <p className="text-sm leading-relaxed text-gray-700">
              {attraction.description}
            </p>
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "h-7 gap-1.5 px-2.5 text-xs",
              })}
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
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "h-7 gap-1.5 px-2.5 text-xs",
              })}
            >
              <BookOpen className="h-3.5 w-3.5" />
              {sourceDomain}
            </a>
          )}
          <a
            href={imagesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "h-7 gap-1.5 px-2.5 text-xs",
            })}
          >
            <Images className="h-3.5 w-3.5" />
            Google Images
          </a>
        </div>

        <AttractionImageGallery attraction={attraction} />

        {onAddToDay ? (
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={onAddToDay}
              disabled={!selectedDayId || attractionStatus.isInAnyDay}
            >
              {!selectedDayId
                ? "Select a day first"
                : attractionStatus.isInAnyDay
                  ? attractionStatus.isInSelectedDay
                    ? "Already in this day"
                    : "Already in another day"
                  : "Add to Day"}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <Button className="w-full" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {onDelete && (
        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete &ldquo;{attraction.name}&rdquo;?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove the attraction from the database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={() => onDelete(attraction.id)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
