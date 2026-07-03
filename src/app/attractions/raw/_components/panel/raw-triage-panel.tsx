"use client";

import { ExternalLink, MapPin, Pencil, X } from "lucide-react";
import Link from "next/link";

import { useRawTriageContext } from "../raw-triage-context";
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

export function RawTriagePanel() {
  const {
    selection,
    clearSelection,
    isMutating,
    onApprove,
    onReject,
    onDuplicated,
  } = useRawTriageContext();

  if (!selection) return null;

  const { attraction } = selection;
  const mapsUrl = `https://www.google.com/maps?q=${attraction.latitude},${attraction.longitude}`;

  return (
    <div className="pointer-events-none absolute bottom-24 left-3 right-3 z-1001 md:bottom-6 md:left-1/2 md:w-full md:max-w-lg md:-translate-x-1/2">
      <div className="pointer-events-auto rounded-xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur-sm" data-testid="raw-triage-panel">
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
          <button
            type="button"
            onClick={clearSelection}
            className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {selection.kind === "raw" && (
          <>
            {selection.attraction.description && (
              <p className="mb-3 line-clamp-3 text-xs leading-relaxed text-gray-600">
                {selection.attraction.description}
              </p>
            )}
            {selection.attraction.missingCoords && (
              <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-800">
                Coordinates missing — shown at 0,0 until geocoded.
              </p>
            )}
            {selection.attraction.cityName && (
              <p className="mb-3 text-xs text-gray-500">
                City: {selection.attraction.cityName}
              </p>
            )}
          </>
        )}

        <div className="mb-3 flex flex-wrap gap-2">
          {selection.kind === "raw" && selection.attraction.sourceUrl && (
            <a
              href={selection.attraction.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100"
            >
              <ExternalLink className="h-3 w-3" />
              {sourceLabel(selection.attraction.source)}
            </a>
          )}
          {selection.kind === "existing" && selection.attraction.sourceUrl && (
            <a
              href={selection.attraction.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100"
            >
              <ExternalLink className="h-3 w-3" />
              {domainLabel(selection.attraction.sourceUrl)}
            </a>
          )}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100"
          >
            <MapPin className="h-3 w-3" />
            Maps
          </a>
          {selection.kind === "existing" &&
            (selection.attraction.id > 0 ? (
              <Link
                href={`/attractions/${selection.attraction.id}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs text-green-700 hover:bg-green-100"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-500">
                <Pencil className="h-3 w-3" />
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
                className="inline-flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs text-green-700 hover:bg-green-100"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </Link>
            )}
        </div>

        {selection.kind === "raw" && selection.attraction.status === "pending" && (
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
