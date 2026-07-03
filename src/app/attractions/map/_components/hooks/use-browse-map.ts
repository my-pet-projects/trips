import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { HIGHLIGHT_FILTER_PILLS } from "~/lib/map/colors";
import {
  buildAttractionMarkerMeta,
  isAttractionVerified,
  toAttractionHighlightKey,
  type AttractionHighlightKey,
} from "~/lib/map/marker-meta";
import { useSetToggleFilter } from "~/lib/map/use-set-toggle-filter";
import { api } from "~/trpc/react";

export { HIGHLIGHT_FILTER_PILLS as BROWSE_HIGHLIGHT_FILTERS };

export function useBrowseMap() {
  const [selectedAttractionId, setSelectedAttractionId] = useState<number | null>(null);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const { visible: visibleHighlights, toggle: toggleHighlight } =
    useSetToggleFilter<AttractionHighlightKey>(["must_see", "recommended", "skip", "none"]);
  const utils = api.useUtils();

  const { data: allAttractions, isLoading } = api.attraction.getAllAttractions.useQuery(
    undefined,
    { staleTime: Infinity, refetchOnWindowFocus: false },
  );

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
  });

  const counts = useMemo(() => {
    const list = allAttractions ?? [];
    return {
      total: list.length,
      verified: list.filter(isAttractionVerified).length,
      must_see: list.filter((a) => a.highlight === "must_see").length,
      recommended: list.filter((a) => a.highlight === "recommended").length,
      skip: list.filter((a) => a.highlight === "skip").length,
      none: list.filter((a) => !a.highlight).length,
    };
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
    if (!showVerifiedOnly || selectedAttractionId == null || !allAttractions) return;
    const selected = allAttractions.find((a) => a.id === selectedAttractionId);
    if (selected && !isAttractionVerified(selected)) {
      setSelectedAttractionId(null);
    }
  }, [showVerifiedOnly, selectedAttractionId, allAttractions]);

  const toggleVerifiedOnly = useCallback(() => {
    setShowVerifiedOnly((v) => !v);
  }, []);

  const selectAttraction = useCallback((id: number | null) => {
    setSelectedAttractionId(id);
  }, []);

  const onHighlightChange = useCallback(
    (attractionId: number, highlight: "must_see" | "recommended" | "skip" | null) => {
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

  return {
    isLoading,
    attractions,
    counts,
    showVerifiedOnly,
    toggleVerifiedOnly,
    visibleHighlights,
    toggleHighlight,
    selectedAttractionId,
    selectedAttractionDetail,
    selectAttraction,
    markerMeta,
    onHighlightChange,
    onDeleteAttraction,
  };
}
