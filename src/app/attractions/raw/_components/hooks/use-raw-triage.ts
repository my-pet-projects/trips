import { useMemo } from "react";

import { api } from "~/trpc/react";

import { createTriageCacheHelpers } from "./raw-triage-cache";
import { usePromotionMap } from "./use-promotion-map";
import { useRawTriageFilters } from "./use-raw-triage-filters";
import { useRawTriageMutations } from "./use-raw-triage-mutations";
import { useRawTriageQueries } from "./use-raw-triage-queries";
import { useRawTriageSelection } from "./use-raw-triage-selection";

export function useRawTriage(countryCode: string | undefined) {
  const utils = api.useUtils();
  const filters = useRawTriageFilters();
  const queries = useRawTriageQueries(
    countryCode,
    filters.visibleStatuses,
    filters.visibleHighlights,
  );

  const cache = useMemo(
    () => createTriageCacheHelpers(utils, queries.queryInput),
    [utils, queries.queryInput],
  );

  const { promotionMapRef, setPromotion, clearPromotion, resolveExistingId } =
    usePromotionMap();

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
    rawAttractions: queries.rawAttractions,
    existing: queries.existing,
    isLoading: queries.isLoading,
    isLoadError: queries.isLoadError,
    loadErrorMessage: queries.loadErrorMessage,
    retryLoad: queries.retryLoad,
    visibleStatuses: filters.visibleStatuses,
    toggleStatus: filters.toggleStatus,
    counts: queries.counts,
    visibleHighlights: filters.visibleHighlights,
    toggleHighlight: filters.toggleHighlight,
    highlightCounts: queries.highlightCounts,
    allPoints: queries.allPoints,
    isMutating: mutations.isMutating,
    selection: selectionState.selection,
    selectRaw: selectionState.selectRaw,
    selectExisting: selectionState.selectExisting,
    clearSelection: selectionState.clearSelection,
    onApprove: mutations.onApprove,
    onReject: mutations.onReject,
    onDuplicated: mutations.onDuplicated,
    resolveExistingId,
    promotionMapRef,
  };
}
