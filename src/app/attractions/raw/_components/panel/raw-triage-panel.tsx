"use client";

import { BookOpen, ExternalLink, MapPin, Pencil, X } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "~/app/_components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/app/_components/ui/tooltip";
import { cn } from "~/lib/utils";
import type { RawTriage } from "../hooks/use-raw-triage";
import { TriageActions } from "./triage-actions";

function sourceLabel(source: string) {
  if (source === "openarium") return "openarium.ru";
  if (source === "votpusk") return "votpusk.ru";
  return source;
}

function domainLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Source";
  }
}

const linkClass = buttonVariants({
  variant: "outline",
  size: "sm",
  className: "h-7 gap-1.5 px-2.5 text-xs",
});

type RawTriagePanelProps = Pick<
  RawTriage,
  | "selection"
  | "isLoading"
  | "clearSelection"
  | "isMutating"
  | "onApprove"
  | "onReject"
  | "onDuplicated"
>;

export function RawTriagePanel({
  selection,
  isLoading,
  clearSelection,
  isMutating,
  onApprove,
  onReject,
  onDuplicated,
}: RawTriagePanelProps) {
  if (!selection || isLoading) return null;

  const { attraction } = selection;
  const mapsUrl = `https://www.google.com/maps?q=${attraction.latitude},${attraction.longitude}`;

  return (
    <div className="pointer-events-none absolute bottom-24 left-3 right-3 z-1001 md:bottom-6 md:left-1/2 md:w-full md:max-w-lg md:-translate-x-1/2">
      <div
        className="pointer-events-auto rounded-xl border border-gray-200 bg-white p-4 shadow-lg"
        data-testid="raw-triage-panel"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-gray-900">
              {attraction.name}
            </h3>
            {attraction.nameLocal && (
              <p className="mt-0.5 truncate text-xs text-gray-500">
                {attraction.nameLocal}
              </p>
            )}
          </div>
          <Tooltip>
            <TooltipTrigger
              type="button"
              onClick={clearSelection}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>Close</TooltipContent>
          </Tooltip>
        </div>

        {selection.kind === "raw" && (
          <>
            {selection.attraction.description && (
              <div className="mb-3 rounded-lg bg-gray-50 p-3">
                <p className="line-clamp-3 text-xs leading-relaxed text-gray-700">
                  {selection.attraction.description}
                </p>
              </div>
            )}
            {selection.attraction.missingCoords && (
              <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-800">
                Coordinates missing — shown at 0,0 until geocoded.
              </p>
            )}
            {selection.attraction.cityName && (
              <p className="mb-3 text-xs text-gray-400">
                {selection.attraction.cityName}
              </p>
            )}
          </>
        )}

        <div className="mb-3 flex flex-wrap items-center gap-2">
          {selection.kind === "raw" && selection.attraction.sourceUrl && (
            <a
              href={selection.attraction.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className={linkClass}
            >
              <BookOpen className="h-3.5 w-3.5" />
              {sourceLabel(selection.attraction.source)}
            </a>
          )}
          {selection.kind === "existing" && selection.attraction.sourceUrl && (
            <a
              href={selection.attraction.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className={linkClass}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {domainLabel(selection.attraction.sourceUrl)}
            </a>
          )}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className={linkClass}
          >
            <MapPin className="h-3.5 w-3.5" />
            Maps
          </a>
          {selection.kind === "existing" &&
            (selection.attraction.id > 0 ? (
              <Link
                href={`/attractions/${selection.attraction.id}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Link>
            ) : (
              <span className={cn(linkClass, "text-gray-500")}>
                <Pencil className="h-3.5 w-3.5" />
                Saving…
              </span>
            ))}
          {selection.kind === "raw" &&
            selection.attraction.status === "approved" &&
            selection.attraction.attractionId && (
              <Link
                href={`/attractions/${selection.attraction.attractionId}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Link>
            )}
        </div>

        {selection.kind === "raw" &&
          selection.attraction.status === "pending" && (
            <TriageActions
              attractionId={selection.attraction.id}
              isMutating={isMutating}
              onApprove={onApprove}
              onReject={onReject}
              onDuplicated={onDuplicated}
            />
          )}
      </div>
    </div>
  );
}
