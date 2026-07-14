import { useCallback, useEffect, useMemo, useState } from "react";

import {
  buildAttractionMarkerMeta,
  isAttractionVerified,
  toAttractionHighlightKey,
  type AttractionHighlightKey,
} from "~/lib/map/marker-meta";
import { useSetToggleFilter } from "~/lib/map/use-set-toggle-filter";
import type { AttractionSummary } from "~/types";

export type AttractionMapFilterCounts = Record<AttractionHighlightKey, number> & {
  total: number;
  verified: number;
};

export type AttractionMapFilters = {
  counts: AttractionMapFilterCounts;
  shownCount: number;
  visibleHighlights: Set<AttractionHighlightKey>;
  toggleHighlight: (key: AttractionHighlightKey) => void;
  showVerifiedOnly: boolean;
  toggleVerifiedOnly: () => void;
};

type AttractionWithHighlight = Pick<
  AttractionSummary,
  "id" | "highlight" | "isVerified"
>;

type UseAttractionMapFiltersOptions<T extends AttractionWithHighlight> = {
  attractions: T[];
  defaultHighlights: AttractionHighlightKey[];
  alwaysVisibleIds?: Set<number>;
  selectedAttractionId?: number | null;
  onSelectionClear?: () => void;
};

export function countAttractionsByHighlight(
  attractions: AttractionWithHighlight[],
): AttractionMapFilterCounts {
  const result: AttractionMapFilterCounts = {
    total: attractions.length,
    verified: 0,
    must_see: 0,
    recommended: 0,
    skip: 0,
    none: 0,
  };
  for (const attraction of attractions) {
    if (isAttractionVerified(attraction)) result.verified++;
    result[toAttractionHighlightKey(attraction.highlight)]++;
  }
  return result;
}

export function useAttractionMapFilters<T extends AttractionWithHighlight>({
  attractions,
  defaultHighlights,
  alwaysVisibleIds,
  selectedAttractionId = null,
  onSelectionClear,
}: UseAttractionMapFiltersOptions<T>) {
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const { visible: visibleHighlights, toggle: toggleHighlight } =
    useSetToggleFilter<AttractionHighlightKey>(defaultHighlights);

  const counts = useMemo(
    () => countAttractionsByHighlight(attractions),
    [attractions],
  );

  const filteredAttractions = useMemo(() => {
    return attractions.filter((attraction) => {
      if (alwaysVisibleIds?.has(attraction.id)) return true;
      if (showVerifiedOnly) return isAttractionVerified(attraction);
      return visibleHighlights.has(toAttractionHighlightKey(attraction.highlight));
    });
  }, [attractions, alwaysVisibleIds, showVerifiedOnly, visibleHighlights]);

  const markerMeta = useMemo(
    () => buildAttractionMarkerMeta(filteredAttractions),
    [filteredAttractions],
  );

  useEffect(() => {
    if (selectedAttractionId == null || !onSelectionClear) return;

    const selected = attractions.find((a) => a.id === selectedAttractionId);
    if (!selected) {
      onSelectionClear();
      return;
    }

    if (alwaysVisibleIds?.has(selected.id)) return;

    if (showVerifiedOnly && !isAttractionVerified(selected)) {
      onSelectionClear();
      return;
    }

    if (
      !showVerifiedOnly &&
      !visibleHighlights.has(toAttractionHighlightKey(selected.highlight))
    ) {
      onSelectionClear();
    }
  }, [
    alwaysVisibleIds,
    attractions,
    onSelectionClear,
    selectedAttractionId,
    showVerifiedOnly,
    visibleHighlights,
  ]);

  const toggleVerifiedOnly = useCallback(() => {
    setShowVerifiedOnly((value) => !value);
  }, []);

  const filters = useMemo<AttractionMapFilters>(
    () => ({
      counts,
      shownCount: filteredAttractions.length,
      visibleHighlights,
      toggleHighlight,
      showVerifiedOnly,
      toggleVerifiedOnly,
    }),
    [
      counts,
      filteredAttractions.length,
      showVerifiedOnly,
      toggleHighlight,
      toggleVerifiedOnly,
      visibleHighlights,
    ],
  );

  return { attractions: filteredAttractions, markerMeta, filters };
}
