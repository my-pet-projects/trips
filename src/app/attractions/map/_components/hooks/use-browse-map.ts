import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { useAttractionMapFilters } from "~/lib/map/use-attraction-map-filters";
import { api } from "~/trpc/react";

export type { AttractionMapFilters as BrowseFilters } from "~/lib/map/use-attraction-map-filters";

export function useBrowseMap() {
  const [selectedAttractionId, setSelectedAttractionId] = useState<number | null>(null);
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

  const selectAttraction = useCallback((id: number | null) => {
    setSelectedAttractionId(id);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedAttractionId(null);
  }, []);

  const { attractions, markerMeta, filters } = useAttractionMapFilters({
    attractions: allAttractions ?? [],
    defaultHighlights: ["must_see", "recommended", "skip", "none"],
    selectedAttractionId,
    onSelectionClear: clearSelection,
  });

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
