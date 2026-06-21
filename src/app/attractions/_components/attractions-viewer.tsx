"use client";

import { useCallback, useMemo, useState } from "react";
import { SkipForward, Star, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

import { ItineraryMap } from "~/app/_components/map/itinerary-map";
import type { MarkerMeta } from "~/app/_components/map/hooks/useLeafletMarkers";
import { api } from "~/trpc/react";

const EMPTY_MAP = new Map();
const EMPTY_ARRAY: never[] = [];

const MUST_SEE_COLOR = "#f59e0b";
const RECOMMENDED_COLOR = "#38bdf8";
const SKIP_COLOR = "#ef4444";
const VERIFIED_COLOR = "#10b981";
const DEFAULT_COLOR = "#9ca3af";

export const AttractionsViewer = () => {
  const [selectedAttractionId, setSelectedAttractionId] = useState<number | null>(null);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const utils = api.useUtils();

  const { data: allAttractions, isLoading } = api.attraction.getAllAttractions.useQuery(undefined, {
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

  const handleAttractionSelect = useCallback((id: number | null) => {
    setSelectedAttractionId(id);
  }, []);

  const handleHighlightChange = useCallback((attractionId: number, highlight: "must_see" | "recommended" | "skip" | null) => {
    updateHighlight.mutate({ id: attractionId, highlight });
  }, [updateHighlight]);

  const handleDeleteAttraction = useCallback((attractionId: number) => {
    if (deleteAttraction.isPending) return;
    deleteAttraction.mutate({ id: attractionId });
  }, [deleteAttraction]);

  const attractions = useMemo(() => {
    if (!allAttractions) return EMPTY_ARRAY;
    if (!showVerifiedOnly) return allAttractions;
    return allAttractions.filter((a) => a.isVerified);
  }, [allAttractions, showVerifiedOnly]);

  const markerMeta = useMemo<Map<number, MarkerMeta>>(() => {
    if (!allAttractions) return EMPTY_MAP as Map<number, MarkerMeta>;
    const map = new Map<number, MarkerMeta>();
    for (const a of allAttractions) {
      let color = a.isVerified ? VERIFIED_COLOR : DEFAULT_COLOR;
      let tag: string = a.isVerified ? "verified" : "default";
      if (a.highlight === "must_see") { color = MUST_SEE_COLOR; tag = "must_see"; }
      else if (a.highlight === "recommended") { color = RECOMMENDED_COLOR; tag = "recommended"; }
      else if (a.highlight === "skip") { color = SKIP_COLOR; tag = "skip"; }
      map.set(a.id, { color, tag });
    }
    return map;
  }, [allAttractions]);

  const verifiedCount = useMemo(
    () => allAttractions?.filter((a) => a.isVerified).length ?? 0,
    [allAttractions],
  );
  const mustSeeCount = useMemo(
    () => allAttractions?.filter((a) => a.highlight === "must_see").length ?? 0,
    [allAttractions],
  );
  const recommendedCount = useMemo(
    () => allAttractions?.filter((a) => a.highlight === "recommended").length ?? 0,
    [allAttractions],
  );
  const skipCount = useMemo(
    () => allAttractions?.filter((a) => a.highlight === "skip").length ?? 0,
    [allAttractions],
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-sky-600" />
          <p className="text-sm font-medium text-gray-600">Loading attractions…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Desktop toolbar */}
      <div className="absolute top-3 left-1/2 z-1000 hidden md:flex w-[calc(100%-1.5rem)] max-w-fit -translate-x-1/2 items-center gap-2 rounded-xl border border-gray-200 bg-white/95 px-4 py-2 shadow-md backdrop-blur-sm">
        <span className="whitespace-nowrap text-xs font-medium text-gray-500">
          {attractions.length.toLocaleString()} attractions
        </span>
        <div className="mx-1 h-4 w-px bg-gray-200" />
        <button
          type="button"
          onClick={() => setShowVerifiedOnly((v) => !v)}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium transition-opacity ${
            showVerifiedOnly ? "opacity-100" : "opacity-40"
          }`}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Verified
          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-gray-600">
            {verifiedCount}
          </span>
        </button>
        <div className="mx-1 h-4 w-px bg-gray-200" />
        <div className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-amber-600">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          Must see
          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-gray-600">
            {mustSeeCount}
          </span>
        </div>
        <div className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-sky-600">
          <ThumbsUp className="h-3.5 w-3.5" />
          Recommended
          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-gray-600">
            {recommendedCount}
          </span>
        </div>
        <div className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-red-500">
          <SkipForward className="h-3.5 w-3.5" />
          Skip
          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-gray-600">
            {skipCount}
          </span>
        </div>
      </div>

      {/* Mobile top — total count */}
      <div className="absolute top-3 left-1/2 z-1000 -translate-x-1/2 md:hidden">
        <div className="rounded-xl border border-gray-200 bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-sm">
          <span className="text-xs font-medium text-gray-500">
            {attractions.length.toLocaleString()} attractions
          </span>
        </div>
      </div>

      {/* Mobile bottom — icon + count pills */}
      <div className="absolute bottom-6 left-3 right-3 z-1000 md:hidden">
        <div className="flex items-center justify-center gap-1.5 rounded-2xl border border-gray-200 bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setShowVerifiedOnly((v) => !v)}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-opacity ${
              showVerifiedOnly ? "opacity-100" : "opacity-30"
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            {verifiedCount}
          </button>
          <div className="mx-0.5 h-4 w-px shrink-0 bg-gray-200" />
          <div className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-amber-600">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {mustSeeCount}
          </div>
          <div className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-sky-600">
            <ThumbsUp className="h-3.5 w-3.5" />
            {recommendedCount}
          </div>
          <div className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-500">
            <SkipForward className="h-3.5 w-3.5" />
            {skipCount}
          </div>
        </div>
      </div>

      <ItineraryMap
        attractions={attractions}
        selectedAttractionDetail={selectedAttractionDetail}
        selectedDayAttractions={EMPTY_ARRAY}
        selectedDayId={null}
        selectedAttractionId={selectedAttractionId}
        hoveredAttractionId={null}
        isLoadingRoutes={false}
        enableClustering={true}
        allDaysAttractions={EMPTY_MAP}
        dayColors={EMPTY_MAP}
        dayRoutes={EMPTY_MAP}
        markerMeta={markerMeta}
        onAttractionSelect={handleAttractionSelect}
        onHighlightChange={handleHighlightChange}
        onDeleteAttraction={handleDeleteAttraction}
        className="h-full w-full"
      />
    </div>
  );
};
