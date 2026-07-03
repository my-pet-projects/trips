"use client";

import { MapFilterBar } from "~/lib/map/map-filter-bar";

import { RawCountrySelector } from "../raw-country-selector";
import { useRawTriageContext } from "../raw-triage-context";
import { HIGHLIGHT_FILTERS, STATUS_FILTERS } from "../types";

export function TriageToolbar({ countryCode }: { countryCode?: string }) {
  const {
    counts,
    highlightCounts,
    visibleStatuses,
    toggleStatus,
    visibleHighlights,
    toggleHighlight,
  } = useRawTriageContext();

  const statusPills = STATUS_FILTERS.map(({ key, label, color }) => ({
    key,
    label,
    color,
    count: counts[key] ?? 0,
  }));

  const highlightPills = HIGHLIGHT_FILTERS.map(({ key, label, color }) => ({
    key,
    label,
    color,
    count: highlightCounts[key] ?? 0,
  }));

  return (
    <MapFilterBar
      desktopLeading={
        <div className="w-52 shrink-0">
          <RawCountrySelector selected={countryCode} compact />
        </div>
      }
      groups={[
        {
          filters: statusPills,
          visible: visibleStatuses,
          onToggle: (key) => toggleStatus(key as (typeof STATUS_FILTERS)[number]["key"]),
        },
        {
          filters: highlightPills,
          visible: visibleHighlights,
          onToggle: (key) =>
            toggleHighlight(key as (typeof HIGHLIGHT_FILTERS)[number]["key"]),
        },
      ]}
      mobileTop={
        <div className="rounded-xl border border-gray-200 bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
          <RawCountrySelector selected={countryCode} compact />
        </div>
      }
    />
  );
}
