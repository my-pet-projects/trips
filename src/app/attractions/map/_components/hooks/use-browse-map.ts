import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  buildAttractionMarkerMeta,
  isAttractionVerified,
  toAttractionHighlightKey,
  type AttractionHighlightKey,
} from "~/lib/map/marker-meta";
import { useSetToggleFilter } from "~/lib/map/use-set-toggle-filter";
import { api } from "~/trpc/react";

export type BrowseCounts = Record<AttractionHighlightKey, number> & {
  total: number;
  verified: number;
};

/** Filter state + counts consumed by the browse toolbar. */
export type BrowseFilters = {
  counts: BrowseCounts;
  shownCount: number;
  showVerifiedOnly: boolean;
  toggleVerifiedOnly: () => void;
  visibleHighlights: Set<AttractionHighlightKey>;
  toggleHighlight: (key: AttractionHighlightKey) => void;
};

export function useBrowseMap() {
  const [selectedAttractionId, setSelectedAttractionId] = useState<number | null>(null);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const { visible: visibleHighlights, toggle: toggleHighlight } =
    useSetToggleFilter<AttractionHighlightKey>(["must_see", "recommended", "skip", "none"]);
  const utils = api.useUtils();

  const {
    data: allAttractions,
    isLoading,
    isError,
    error,
    refetch,
  } = api.attraction.getAllAttractions.useQuery(undefined, {
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const { data: selectedAttractionDetail } = api.attraction.getAttractionById.useQuery(
    { id: selectedAttractionId! },
    { enabled: !!selectedAttractionId, staleTime: Infinity },
  );

  const deleteAttraction = api.attraction.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.attraction.getAllAttractions.cancel();
      utils.attraction.getAllAttractions.setData(undefined, (prev) =>
        prev?.filter((a) => a.id !== id),
      );
      setSelectedAttractionId(null);
    },
    onError: () => {
      void utils.attraction.getAllAttractions.invalidate();
      toast.error("Failed to delete attraction");
    },
    onSettled: () => {
      void utils.attraction.getAllAttractions.invalidate();
    },
  });

  const updateHighlight = api.attraction.updateHighlight.useMutation({
    onMutate: async ({ id, highlight }) => {
      await utils.attraction.getAllAttractions.cancel();
      utils.attraction.getAllAttractions.setData(undefined, (prev) =>
        prev?.map((a) => (a.id === id ? { ...a, highlight } : a)),
      );
    },
    onError: () => {
      void utils.attraction.getAllAttractions.invalidate();
      toast.error("Failed to update highlight");
    },
    onSettled: () => {
      void utils.attraction.getAllAttractions.invalidate();
    },
  });

  const counts: BrowseCounts = useMemo(() => {
    const list = allAttractions ?? [];
    const result = {
      total: list.length,
      verified: 0,
      must_see: 0,
      recommended: 0,
      skip: 0,
      none: 0,
    };
    for (const attraction of list) {
      if (isAttractionVerified(attraction)) result.verified++;
      const key = toAttractionHighlightKey(attraction.highlight);
      result[key]++;
    }
    return result;
  }, [allAttractions]);

  const attractions = useMemo(() => {
    if (!allAttractions) return [];
    if (showVerifiedOnly) return allAttractions.filter(isAttractionVerified);
    return allAttractions.filter((a) =>
      visibleHighlights.has(toAttractionHighlightKey(a.highlight)),
    );
  }, [allAttractions, showVerifiedOnly, visibleHighlights]);

  const markerMeta = useMemo(() => buildAttractionMarkerMeta(attractions), [attractions]);

  useEffect(() => {
    if (selectedAttractionId == null || !allAttractions) return;

    const selected = allAttractions.find((a) => a.id === selectedAttractionId);
    if (!selected) {
      setSelectedAttractionId(null);
      return;
    }

    if (showVerifiedOnly && !isAttractionVerified(selected)) {
      setSelectedAttractionId(null);
      return;
    }

    if (
      !showVerifiedOnly &&
      !visibleHighlights.has(toAttractionHighlightKey(selected.highlight))
    ) {
      setSelectedAttractionId(null);
    }
  }, [showVerifiedOnly, visibleHighlights, selectedAttractionId, allAttractions]);

  const toggleVerifiedOnly = useCallback(() => {
    setShowVerifiedOnly((v) => !v);
  }, []);

  const selectAttraction = useCallback((id: number | null) => {
    setSelectedAttractionId(id);
  }, []);

  const onHighlightChange = useCallback(
    (attractionId: number, highlight: "must_see" | "recommended" | "skip" | null) => {
      if (updateHighlight.isPending) return;
      updateHighlight.mutate({ id: attractionId, highlight });
    },
    [updateHighlight],
  );

  const onDeleteAttraction = useCallback(
    (attractionId: number) => {
      if (deleteAttraction.isPending) return;
      deleteAttraction.mutate({ id: attractionId });
    },
    [deleteAttraction],
  );

  const retryLoad = useCallback(() => {
    void refetch();
  }, [refetch]);

  const loadErrorMessage = useMemo(() => {
    if (!error) return null;
    return error.message || "Failed to load attractions";
  }, [error]);

  const filters = useMemo<BrowseFilters>(
    () => ({
      counts,
      shownCount: attractions.length,
      showVerifiedOnly,
      toggleVerifiedOnly,
      visibleHighlights,
      toggleHighlight,
    }),
    [
      counts,
      attractions.length,
      showVerifiedOnly,
      toggleVerifiedOnly,
      visibleHighlights,
      toggleHighlight,
    ],
  );

  return {
    isLoading,
    isError,
    loadErrorMessage,
    retryLoad,
    attractions,
    filters,
    selectedAttractionId,
    selectedAttractionDetail,
    selectAttraction,
    markerMeta,
    onHighlightChange,
    onDeleteAttraction,
  };
}
