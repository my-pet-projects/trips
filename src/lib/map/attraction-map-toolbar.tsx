"use client";

import { MapFilterBar } from "~/lib/map/map-filter-bar";
import {
  HIGHLIGHT_FILTER_PILLS,
  VERIFIED_FILTER_PILL,
  type AttractionHighlightKey,
} from "~/lib/map/colors";

import type { AttractionMapFilters } from "./use-attraction-map-filters";

type AttractionMapToolbarProps = {
  filters: AttractionMapFilters;
  showVerifiedFilter?: boolean;
};

export function AttractionMapToolbar({
  filters,
  showVerifiedFilter = false,
}: AttractionMapToolbarProps) {
  const {
    counts,
    shownCount,
    showVerifiedOnly,
    toggleVerifiedOnly,
    visibleHighlights,
    toggleHighlight,
  } = filters;

  const highlightPills = HIGHLIGHT_FILTER_PILLS.map(({ key, label, color }) => ({
    key,
    label,
    color,
    count: counts[key] ?? 0,
  }));

  const groups = showVerifiedFilter
    ? [
        {
          id: "verified",
          filters: [{ ...VERIFIED_FILTER_PILL, count: counts.verified }],
          visible: showVerifiedOnly ? new Set(["verified"]) : new Set<string>(),
          onToggle: () => toggleVerifiedOnly(),
        },
        {
          id: "highlight",
          filters: highlightPills,
          visible: visibleHighlights,
          onToggle: (key: string) => toggleHighlight(key as AttractionHighlightKey),
          disabled: showVerifiedOnly,
        },
      ]
    : [
        {
          id: "highlight",
          filters: highlightPills,
          visible: visibleHighlights,
          onToggle: (key: string) => toggleHighlight(key as AttractionHighlightKey),
        },
      ];

  return (
    <MapFilterBar
      desktopSummary={
        <span className="whitespace-nowrap text-xs font-medium text-gray-500">
          {shownCount.toLocaleString()} shown · {counts.total.toLocaleString()} total
        </span>
      }
      groups={groups}
      mobileTop={
        <div className="flex justify-center">
          <div className="rounded-xl border border-gray-200 bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-sm">
            <span className="text-xs font-medium text-gray-500">
              {shownCount.toLocaleString()} shown
            </span>
          </div>
        </div>
      }
    />
  );
}
