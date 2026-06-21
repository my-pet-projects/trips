"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer } from "react-leaflet";

import { FitBounds, MarkersLayer } from "./markers-layer";
import { RawCountrySelector } from "./raw-country-selector";
import { FILTERS, HIGHLIGHT_FILTERS, useRawTriage } from "./use-raw-triage";

interface RawAttractionsMapInnerProps {
  countryCode?: string;
}

export function RawAttractionsMapInner({
  countryCode,
}: RawAttractionsMapInnerProps) {
  const {
    rawAttractions,
    existing,
    isLoading,
    visibleStatuses,
    toggleStatus,
    counts,
    visibleHighlights,
    toggleHighlight,
    highlightCounts,
    allPoints,
    isMutating,
    onApprove,
    onReject,
    onDuplicated,
  } = useRawTriage(countryCode);

  return (
    <div className="relative h-full w-full">
      {!countryCode && (
        <div className="absolute inset-0 z-1000 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <p className="text-gray-500">Select a country to start triaging</p>
        </div>
      )}
      {isLoading && (
        <div className="absolute inset-0 z-1000 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-md">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-violet-600" />
            <span className="text-sm text-gray-600">Loading attractions…</span>
          </div>
        </div>
      )}

      {/* Desktop toolbar */}
      <div className="absolute top-3 left-1/2 z-1000 hidden md:flex w-[calc(100%-1.5rem)] max-w-fit -translate-x-1/2 items-center gap-2 rounded-xl border border-gray-200 bg-white/95 px-4 py-2 shadow-md backdrop-blur-sm">
        <div className="w-52 shrink-0">
          <RawCountrySelector selected={countryCode} compact />
        </div>
        <div className="mx-1 h-4 w-px shrink-0 bg-gray-200" />
        <div className="flex items-center gap-2">
          {FILTERS.map(({ key, label, color }) => (
            <button
              type="button"
              key={key}
              onClick={() => toggleStatus(key)}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium transition-opacity ${
                visibleStatuses.has(key) ? "opacity-100" : "opacity-40"
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
              {label}
              <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-gray-600">
                {counts[key]}
              </span>
            </button>
          ))}
          <div className="mx-1 h-4 w-px shrink-0 bg-gray-200" />
          {HIGHLIGHT_FILTERS.map(({ key, label, color }) => (
            <button
              type="button"
              key={key}
              onClick={() => toggleHighlight(key)}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium transition-opacity ${
                visibleHighlights.has(key) ? "opacity-100" : "opacity-40"
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
              {label}
              <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-gray-600">
                {highlightCounts[key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile top bar — country selector */}
      <div className="absolute top-3 left-3 right-3 z-1000 md:hidden">
        <div className="rounded-xl border border-gray-200 bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
          <RawCountrySelector selected={countryCode} compact />
        </div>
      </div>

      {/* Mobile bottom bar — dot + count pills */}
      <div className="absolute bottom-6 left-3 right-3 z-1000 md:hidden">
        <div className="flex items-center justify-center gap-1.5 rounded-2xl border border-gray-200 bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
          {FILTERS.map(({ key, color }) => (
            <button
              type="button"
              key={key}
              onClick={() => toggleStatus(key)}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-opacity ${
                visibleStatuses.has(key) ? "opacity-100" : "opacity-30"
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
              {counts[key]}
            </button>
          ))}
          <div className="mx-0.5 h-4 w-px shrink-0 bg-gray-200" />
          {HIGHLIGHT_FILTERS.map(({ key, color }) => (
            <button
              type="button"
              key={key}
              onClick={() => toggleHighlight(key)}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-opacity ${
                visibleHighlights.has(key) ? "opacity-100" : "opacity-30"
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
              {highlightCounts[key]}
            </button>
          ))}
        </div>
      </div>

      <MapContainer
        center={[20, 0]}
        zoom={4}
        scrollWheelZoom
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {allPoints.length > 0 && (
          <FitBounds points={allPoints} countryCode={countryCode} />
        )}
        <MarkersLayer
          rawAttractions={rawAttractions}
          existing={existing}
          visibleStatuses={visibleStatuses}
          visibleHighlights={visibleHighlights}
          isMutating={isMutating}
          onApprove={onApprove}
          onReject={onReject}
          onDuplicated={onDuplicated}
        />
      </MapContainer>
    </div>
  );
}
