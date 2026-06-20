"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SkipForward, Star, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

import { ItineraryMap } from "~/app/_components/map/itinerary-map";
import type { MarkerMeta } from "~/app/_components/map/hooks/useLeafletMarkers";
import { api } from "~/trpc/react";
import type { AllAttraction } from "~/types";

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

  const attractions = useMemo(() => {
    if (!allAttractions) return EMPTY_ARRAY;
    if (!showVerifiedOnly) return allAttractions;
    return allAttractions.filter((a) => a.isVerified);
  }, [allAttractions, showVerifiedOnly]);

  useEffect(() => {
    if (selectedAttractionId && !attractions.some((a) => a.id === selectedAttractionId)) {
      setSelectedAttractionId(null);
    }
  }, [attractions, selectedAttractionId]);

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
    () => allAttractions?.filter((a: AllAttraction) => a.isVerified).length ?? 0,
    [allAttractions],
  );

  const recommendedCount = useMemo(
    () => allAttractions?.filter((a: AllAttraction) => a.highlight === "recommended").length ?? 0,
    [allAttractions],
  );

  const mustSeeCount = useMemo(
    () => allAttractions?.filter((a: AllAttraction) => a.highlight === "must_see").length ?? 0,
    [allAttractions],
  );

  const skipCount = useMemo(
    () => allAttractions?.filter((a: AllAttraction) => a.highlight === "skip").length ?? 0,
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
      {/* Toolbar */}
      <div className="absolute top-3 left-1/2 z-1000 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-gray-200 bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm whitespace-nowrap">
        <span className="text-xs font-medium text-gray-500">
          {attractions.length.toLocaleString()} attractions
        </span>
        <div className="mx-1 h-4 w-px bg-gray-200" />
        <button
          type="button"
          onClick={() => setShowVerifiedOnly((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-opacity ${
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
        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          Must see
          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-gray-600">
            {mustSeeCount}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-sky-600">
          <ThumbsUp className="h-3.5 w-3.5" />
          Recommended
          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-gray-600">
            {recommendedCount}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-red-500">
          <SkipForward className="h-3.5 w-3.5" />
          Skip
          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-gray-600">
            {skipCount}
          </span>
        </div>
      </div>

      <ItineraryMap
        attractions={attractions}
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
        className="h-full w-full"
      />
    </div>
  );
};
