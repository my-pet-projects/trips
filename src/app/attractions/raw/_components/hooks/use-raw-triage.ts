import { useCallback, useMemo, useRef } from "react";

import { useSetToggleFilter } from "~/lib/map/use-set-toggle-filter";
import { api } from "~/trpc/react";

import type { HighlightIconKey, StatusFilter } from "../types";
import { createTriageCacheHelpers } from "./raw-triage-cache";
import { useRawTriageMutations } from "./use-raw-triage-mutations";
import { useRawTriageQueries } from "./use-raw-triage-queries";
import { useRawTriageSelection } from "./use-raw-triage-selection";

export function useRawTriage(countryCode: string | undefined) {
  const utils = api.useUtils();
  const promotionMapRef = useRef(new Map<number, number>());

  const { visible: visibleStatuses, toggle: toggleStatus } = useSetToggleFilter<StatusFilter>([
    "pending",
  ]);
  const { visible: visibleHighlights, toggle: toggleHighlight } =
    useSetToggleFilter<HighlightIconKey>(["must_see", "recommended", "skip", "none"]);

  const queries = useRawTriageQueries(countryCode, visibleStatuses, visibleHighlights);

  const cache = useMemo(
    () => createTriageCacheHelpers(utils, queries.queryInput),
    [utils, queries.queryInput],
  );

  const setPromotion = useCallback((rawId: number, realId: number) => {
    promotionMapRef.current.set(rawId, realId);
  }, []);

  const clearPromotion = useCallback((rawId: number) => {
    promotionMapRef.current.delete(rawId);
  }, []);

  const resolveExistingId = useCallback((id: number): number => {
    if (id >= 0) return id;
    return promotionMapRef.current.get(-id) ?? id;
  }, []);

  const selectionState = useRawTriageSelection(
    countryCode,
    queries.rawAttractions,
    queries.existing,
    resolveExistingId,
  );

  const mutations = useRawTriageMutations({
    queryInput: queries.queryInput,
    cache,
    setPromotion,
    clearPromotion,
    setSelection: selectionState.setSelection,
  });

  return {
    isLoading: queries.isLoading,
    isLoadError: queries.isLoadError,
    loadErrorMessage: queries.loadErrorMessage,
    retryLoad: queries.retryLoad,
    filters: {
      counts: queries.counts,
      highlightCounts: queries.highlightCounts,
      visibleStatuses,
      toggleStatus,
      visibleHighlights,
      toggleHighlight,
    },
    panel: {
      selection: selectionState.selection,
      isLoading: queries.isLoading,
      clearSelection: selectionState.clearSelection,
      isMutating: mutations.isMutating,
      onApprove: mutations.onApprove,
      onReject: mutations.onReject,
      onDuplicated: mutations.onDuplicated,
    },
    map: {
      allPoints: queries.allPoints,
      rawAttractions: queries.rawAttractions,
      existing: queries.existing,
      selection: selectionState.selection,
      selectRaw: selectionState.selectRaw,
      selectExisting: selectionState.selectExisting,
      clearSelection: selectionState.clearSelection,
      resolveExistingId,
      promotionMapRef,
    },
  };
}

type RawTriage = ReturnType<typeof useRawTriage>;
export type RawTriageFilters = RawTriage["filters"];
export type RawTriagePanelData = RawTriage["panel"];
export type RawMapData = RawTriage["map"];
