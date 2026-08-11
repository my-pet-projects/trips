"use client";

import { ArrowLeft, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { ItineraryMap } from "~/app/_components/map/itinerary-map";
import { Badge } from "~/app/_components/ui/badge";
import { Button } from "~/app/_components/ui/button";
import { buildFlexibleItineraryTimeline } from "~/lib/itinerary/build-flexible-itinerary-timeline";
import { useItineraryRoutes } from "~/lib/itinerary/use-itinerary-routes";
import { usePlanBlockMaps } from "~/lib/itinerary/use-plan-block-maps";
import { DEFAULT_BLOCK_COLOR } from "~/lib/map/colors";
import type { AttractionDetail, Trip } from "~/types";

type ItineraryViewerProps = {
  trip: Trip;
  tripAttractions: AttractionDetail[];
};

export function ItineraryViewer({
  trip,
  tripAttractions: attractions,
}: ItineraryViewerProps) {
  const { planBlocks } = trip;
  const chronologicalPlanBlocks = useMemo(() => {
    const timeline = buildFlexibleItineraryTimeline(
      planBlocks,
      trip.overnightStops,
    );
    return [
      ...timeline.entries
        .filter((entry) => entry.type === "plan")
        .map((entry) => entry.block),
      ...timeline.undatedBlocks,
    ];
  }, [planBlocks, trip.overnightStops]);
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(
    () => chronologicalPlanBlocks[0]?.id ?? null,
  );
  const [selectedAttractionId, setSelectedAttractionId] = useState<
    number | null
  >(null);

  const { blockColors, attractionToBlockMap } = usePlanBlockMaps(planBlocks);
  const { blockRoutes, labeledRoutes, isLoadingRoutes } =
    useItineraryRoutes(trip.id);

  const selectedBlock = useMemo(
    () => planBlocks.find((b) => b.id === selectedBlockId),
    [planBlocks, selectedBlockId],
  );

  const blockColor = useMemo(
    () => blockColors.get(selectedBlockId ?? 0) ?? DEFAULT_BLOCK_COLOR,
    [blockColors, selectedBlockId],
  );

  const selectedBlockIndex = chronologicalPlanBlocks.findIndex(
    (b) => b.id === selectedBlockId,
  );
  const canGoPrevBlock = selectedBlockIndex > 0;
  const canGoNextBlock =
    selectedBlockIndex >= 0 &&
    selectedBlockIndex < chronologicalPlanBlocks.length - 1;

  const handlePrevBlock = useCallback(() => {
    if (canGoPrevBlock) {
      const prevBlock = chronologicalPlanBlocks[selectedBlockIndex - 1];
      if (prevBlock) {
        setSelectedBlockId(prevBlock.id);
        setSelectedAttractionId(null);
      }
    }
  }, [canGoPrevBlock, chronologicalPlanBlocks, selectedBlockIndex]);

  const handleNextBlock = useCallback(() => {
    if (canGoNextBlock) {
      const nextBlock = chronologicalPlanBlocks[selectedBlockIndex + 1];
      if (nextBlock) {
        setSelectedBlockId(nextBlock.id);
        setSelectedAttractionId(null);
      }
    }
  }, [canGoNextBlock, chronologicalPlanBlocks, selectedBlockIndex]);

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-2 py-2 shadow-sm md:px-4 md:py-3">
        <div className="flex items-center justify-between">
          {/* Mobile: back button */}
          <Link
            href="/trips"
            className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-600 md:hidden"
            aria-label="Back to trips"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            data-testid="itinerary-prev-plan"
            onClick={handlePrevBlock}
            disabled={!canGoPrevBlock}
            className="text-gray-600 md:size-10"
            aria-label="Previous plan"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
          </Button>

          <div className="flex min-w-0 items-center gap-1.5 md:gap-2">
            <div
              className="h-3 w-3 shrink-0 rounded-full shadow-md md:h-4 md:w-4"
              style={{ backgroundColor: blockColor }}
            />
            <h1 className="truncate text-sm font-bold text-gray-900 md:text-lg">
              {selectedBlock?.name}
            </h1>
            <Badge
              variant="muted"
              className="shrink-0 px-1.5 py-0.5 font-semibold md:px-2"
            >
              {selectedBlock?.attractions.length ?? 0} stops
            </Badge>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            data-testid="itinerary-next-plan"
            onClick={handleNextBlock}
            disabled={!canGoNextBlock}
            className="text-gray-600 md:size-10"
            aria-label="Next plan"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
          </Button>

          {/* Mobile: edit button */}
          <Link
            href={`/trips/${trip.id}/edit`}
            className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-600 md:hidden"
            aria-label="Edit trip"
          >
            <Pencil className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Map */}
      <div className="relative flex-1 overflow-hidden">
        <ItineraryMap
          attractions={attractions}
          selectedBlockAttractions={selectedBlock?.attractions ?? []}
          selectedBlockId={selectedBlockId}
          selectedAttractionId={selectedAttractionId}
          attractionToBlockMap={attractionToBlockMap}
          blockColors={blockColors}
          hoveredAttractionId={null}
          blockRoutes={blockRoutes}
          labeledConnectorRoutes={labeledRoutes}
          isLoadingRoutes={isLoadingRoutes}
          overnightStops={trip.overnightStops}
          onAttractionSelect={setSelectedAttractionId}
          enableLocationTracking
          tripsImageSource="map-view"
        />
      </div>

      {/* Attractions List */}
      {selectedBlock &&
        selectedBlock.attractions.length > 0 &&
        !selectedAttractionId && (
          <div className="border-t border-gray-200 bg-white p-4 shadow-lg">
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase">
              Attractions for {selectedBlock.name}
            </h2>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {selectedBlock.attractions.map((attraction, index) => (
                <Button
                  type="button"
                  variant="outline"
                  key={attraction.id}
                  onClick={() => setSelectedAttractionId(attraction.id)}
                  className="h-auto w-full justify-start gap-3 rounded-lg border-gray-200 bg-gray-50 p-3 text-left hover:bg-gray-100 active:bg-gray-200"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow"
                    style={{ backgroundColor: blockColor }}
                  >
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">
                      {attraction.name}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
                </Button>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
