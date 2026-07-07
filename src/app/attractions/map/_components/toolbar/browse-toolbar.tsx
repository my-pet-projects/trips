"use client";

import { MapFilterBar } from "~/lib/map/map-filter-bar";
import {
  HIGHLIGHT_FILTER_PILLS,
  VERIFIED_FILTER_PILL,
  type AttractionHighlightKey,
} from "~/lib/map/colors";

import { useBrowseMapContext } from "../browse-context";

export function BrowseToolbar() {
  const {
    counts,
    attractions,
    showVerifiedOnly,
    toggleVerifiedOnly,
    visibleHighlights,
    toggleHighlight,
  } = useBrowseMapContext();

  const highlightPills = HIGHLIGHT_FILTER_PILLS.map(({ key, label, color }) => ({
    key,
    label,
    color,
    count: counts[key] ?? 0,
  }));

  const verifiedPill = {
    ...VERIFIED_FILTER_PILL,
    count: counts.verified,
  };

  return (
    <MapFilterBar
      desktopSummary={
        <span className="whitespace-nowrap text-xs font-medium text-gray-500">
          {attractions.length.toLocaleString()} shown · {counts.total.toLocaleString()} total
        </span>
      }
      groups={[
        {
          id: "verified",
          filters: [verifiedPill],
          visible: showVerifiedOnly ? new Set(["verified"]) : new Set(),
          onToggle: () => toggleVerifiedOnly(),
        },
        {
          id: "highlight",
          filters: highlightPills,
          visible: visibleHighlights,
          onToggle: (key) => toggleHighlight(key as AttractionHighlightKey),
          disabled: showVerifiedOnly,
        },
      ]}
      mobileTop={
        <div className="flex justify-center">
          <div className="rounded-xl border border-gray-200 bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-sm">
            <span className="text-xs font-medium text-gray-500">
              {attractions.length.toLocaleString()} shown
            </span>
          </div>
        </div>
      }
    />
  );
}
