"use client";

import { useMemo } from "react";

import { MapFilterBar } from "~/lib/map/map-filter-bar";
import { HIGHLIGHT_FILTER_PILLS, STATUS_FILTER_PILLS } from "~/lib/map/colors";

import { RawCountrySelector } from "../raw-country-selector";
import { useRawTriageContext } from "../raw-triage-context";

export function TriageToolbar({ countryCode }: { countryCode?: string }) {
  const {
    counts,
    highlightCounts,
    visibleStatuses,
    toggleStatus,
    visibleHighlights,
    toggleHighlight,
  } = useRawTriageContext();

  const statusPills = STATUS_FILTER_PILLS.map(({ key, label, color }) => ({
    key,
    label:
      key === "pending"
        ? "Pending"
        : key === "rejected"
          ? "Rejected"
          : "Duped",
    color,
    count: counts[key] ?? 0,
  }));

  const highlightPills = HIGHLIGHT_FILTER_PILLS.map(({ key, label, color }) => ({
    key,
    label,
    color,
    count: highlightCounts[key] ?? 0,
  }));

  const desktopLeading = useMemo(
    () => (
      <div className="w-44 shrink-0">
        <RawCountrySelector selected={countryCode} compact />
      </div>
    ),
    [countryCode],
  );

  const mobileTop = useMemo(
    () => (
      <div className="rounded-xl border border-gray-200 bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
        <RawCountrySelector selected={countryCode} compact />
      </div>
    ),
    [countryCode],
  );

  return (
    <MapFilterBar
      desktopLeading={desktopLeading}
      groups={[
        {
          id: "status",
          filters: statusPills,
          visible: visibleStatuses,
          onToggle: (key) => toggleStatus(key as (typeof STATUS_FILTER_PILLS)[number]["key"]),
        },
        {
          id: "highlight",
          filters: highlightPills,
          visible: visibleHighlights,
          onToggle: (key) =>
            toggleHighlight(key as (typeof HIGHLIGHT_FILTER_PILLS)[number]["key"]),
        },
      ]}
      mobileTop={mobileTop}
    />
  );
}
