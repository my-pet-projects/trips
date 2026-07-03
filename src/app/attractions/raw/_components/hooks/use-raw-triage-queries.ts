import { useCallback, useMemo } from "react";

import { api } from "~/trpc/react";

import { normalizeMapCoords } from "../coords";
import { getTriageErrorMessage } from "../errors";
import type { HighlightIconKey, StatusFilter, TriageMapQueryInput } from "../types";
import { toHighlightIconKey } from "../types";

export function useRawTriageQueries(
  countryCode: string | undefined,
  visibleStatuses: Set<StatusFilter>,
  visibleHighlights: Set<HighlightIconKey>,
) {
  const queryInput = useMemo((): TriageMapQueryInput | null => {
    if (!countryCode) return null;
    return { countryCode };
  }, [countryCode]);

  const triageQuery = api.rawAttraction.getTriageMapData.useQuery(queryInput!, {
    enabled: !!queryInput,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const rawData = triageQuery.data?.raw ?? [];
  const existingData = triageQuery.data?.existing ?? [];
  const counts = triageQuery.data?.counts ?? { pending: 0, rejected: 0, duplicated: 0 };
  const highlightCounts = triageQuery.data?.highlightCounts ?? {
    must_see: 0,
    recommended: 0,
    skip: 0,
    none: 0,
  };

  const isLoadError = triageQuery.isError;

  const loadErrorMessage = useMemo(() => {
    if (triageQuery.error) return getTriageErrorMessage(triageQuery.error);
    return null;
  }, [triageQuery.error]);

  const retryLoad = useCallback(() => {
    if (triageQuery.isError) void triageQuery.refetch();
  }, [triageQuery]);

  const rawAttractions = useMemo(
    () =>
      rawData
        .filter(
          (r) =>
            r.status !== "approved" &&
            visibleStatuses.has(r.status as StatusFilter),
        )
        .map((r) => normalizeMapCoords(r)),
    [rawData, visibleStatuses],
  );

  const existing = useMemo(
    () =>
      existingData
        .filter((a) => visibleHighlights.has(toHighlightIconKey(a.highlight)))
        .map((a) => normalizeMapCoords(a)),
    [existingData, visibleHighlights],
  );

  const allPoints = useMemo<[number, number][]>(
    () => [
      ...rawAttractions.flatMap((r) =>
        !r.missingCoords ? [[r.latitude, r.longitude] as [number, number]] : [],
      ),
      ...existing.flatMap((e) =>
        !e.missingCoords ? [[e.latitude, e.longitude] as [number, number]] : [],
      ),
    ],
    [rawAttractions, existing],
  );

  return {
    rawAttractions,
    existing,
    counts,
    highlightCounts,
    isLoading: !!countryCode && triageQuery.isPending && !isLoadError,
    isLoadError,
    loadErrorMessage,
    retryLoad,
    allPoints,
    queryInput,
  };
}
