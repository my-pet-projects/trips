"use client";

import { AlertCircle, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { ItineraryMap } from "~/app/_components/map/itinerary-map";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "~/app/_components/ui/alert";
import { Button } from "~/app/_components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "~/app/_components/ui/empty";
import { Spinner } from "~/app/_components/ui/spinner";
import { usePlanBlockEditor } from "~/lib/itinerary/use-plan-block-editor";
import {
  useItineraryRoutes,
  shouldFetchBlockRoute,
} from "~/lib/itinerary/use-itinerary-routes";
import { useAttractionMapFilters } from "~/lib/map/use-attraction-map-filters";
import { AttractionMapToolbar } from "~/lib/map/attraction-map-toolbar";
import { usePlanBlockMaps } from "~/lib/itinerary/use-plan-block-maps";
import type { AttractionDetail, Trip } from "~/types";
import { PlanBlocksPdfButton } from "./plan-block-pdf-export-button";
import { ItineraryTimeline } from "./itinerary-timeline";
import { PlanBlockCard } from "./plan-block";

type ItineraryPlannerProps = {
  trip: Trip;
  tripAttractions: AttractionDetail[];
};

export function ItineraryPlanner({
  trip,
  tripAttractions: attractions,
}: ItineraryPlannerProps) {
  const [hoveredAttraction, setHoveredAttraction] = useState<number | null>(
    null,
  );
  const [selectedAttractionId, setSelectedAttractionId] = useState<
    number | null
  >(null);

  const {
    planBlocks,
    selectedBlockId,
    setSelectedBlockId,
    isSaving,
    isAddingBlock,
    blockBeingRemoved,
    saveError,
    addBlock,
    removeBlock,
    retrySave,
    addAttractionToBlock,
    removeAttraction,
    reorderAttractions,
    moveBlock,
    updateBlock,
  } = usePlanBlockEditor(trip);

  const { blockColors, attractionToBlockMap } = usePlanBlockMaps(planBlocks);
  const {
    blockRoutes,
    blockRouteErrors,
    overnightLegs,
    isLoadingRoutes,
    routeError,
  } = useItineraryRoutes(trip.id);

  const handleSelectAttraction = useCallback(
    (attractionId: number | null) => {
      setSelectedAttractionId(attractionId);
      if (attractionId === null) return;
      const block = attractionToBlockMap.get(attractionId);
      if (block) setSelectedBlockId(block.id);
    },
    [attractionToBlockMap, setSelectedBlockId],
  );

  const selectedBlockAttractions = useMemo(
    () => planBlocks.find((b) => b.id === selectedBlockId)?.attractions ?? [],
    [planBlocks, selectedBlockId],
  );
  const undatedPlanBlocks = useMemo(
    () => planBlocks.filter((block) => !block.pinnedStartDate),
    [planBlocks],
  );

  const plannedAttractionIds = useMemo(() => {
    const ids = new Set<number>();
    for (const block of planBlocks) {
      for (const attraction of block.attractions) {
        ids.add(attraction.id);
      }
    }
    return ids;
  }, [planBlocks]);

  const handleDeselectAttraction = useCallback(() => {
    setSelectedAttractionId(null);
  }, []);

  const {
    attractions: mapAttractions,
    markerMeta,
    filters,
  } = useAttractionMapFilters({
    attractions,
    defaultHighlights: ["must_see", "recommended", "none"],
    alwaysVisibleIds: plannedAttractionIds,
    selectedAttractionId,
    onSelectionClear: handleDeselectAttraction,
  });

  const handleAddAttractionToBlock = (attraction: AttractionDetail) => {
    if (addAttractionToBlock(selectedBlockId, attraction)) {
      setSelectedAttractionId(null);
    }
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-2">
      <div className="min-h-0 space-y-4 overflow-y-auto px-4 py-4 lg:border-r lg:border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Plans &amp; overnight stays
            </h2>
            {isSaving && (
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                <Spinner className="h-3.5 w-3.5" />
                Saving...
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <PlanBlocksPdfButton
              blocks={planBlocks}
              tripName={trip.name}
              blockColors={blockColors}
              disabled={planBlocks.every((b) => b.attractions.length === 0)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => addBlock()}
              disabled={isAddingBlock}
            >
              <Plus className="h-4 w-4" />
              {isAddingBlock ? "Adding..." : "Add plan"}
            </Button>
          </div>
        </div>

        {saveError && (
          <Alert
            variant="destructive"
            className="flex items-center justify-between gap-3 border-red-200 bg-red-50 px-4 py-3 [&>svg]:text-red-600"
          >
            <div className="flex min-w-0 items-start gap-2">
              <AlertCircle />
              <div>
                <AlertTitle className="text-red-900">
                  Could not save changes
                </AlertTitle>
                <AlertDescription className="text-red-800">
                  {saveError}
                </AlertDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={retrySave}
              disabled={isSaving}
              className="shrink-0 bg-red-100 text-red-800 hover:bg-red-200"
            >
              {isSaving ? "Saving..." : "Retry"}
            </Button>
          </Alert>
        )}

        {(planBlocks.length > 0 || trip.overnightStops.length > 0) && (
          <ItineraryTimeline
            planBlocks={planBlocks}
            overnightStops={trip.overnightStops}
            renderBlock={(block) => {
              const undatedIndex = undatedPlanBlocks.findIndex(
                (item) => item.id === block.id,
              );
              return (
                <PlanBlockCard
                  key={block.id}
                  block={block}
                  index={planBlocks.findIndex((item) => item.id === block.id)}
                  trip={trip}
                  overnightLegs={overnightLegs.get(block.id)}
                  routeData={blockRoutes.get(block.id) ?? null}
                  routeError={blockRouteErrors.get(block.id) ?? routeError}
                  isLoadingRoute={
                    shouldFetchBlockRoute(block.id, block.attractions) &&
                    isLoadingRoutes
                  }
                  state={{
                    isSelected: selectedBlockId === block.id,
                    isRemoving: blockBeingRemoved === block.id,
                    selectedAttractionId,
                    canMoveUp: undatedIndex > 0,
                    canMoveDown:
                      undatedIndex >= 0 &&
                      undatedIndex < undatedPlanBlocks.length - 1,
                  }}
                  actions={{
                    select: () => setSelectedBlockId(block.id),
                    update: (patch) => updateBlock(block.id, patch),
                    remove: () => removeBlock(block.id),
                    move: (direction) => moveBlock(block.id, direction),
                    selectAttraction: handleSelectAttraction,
                    hoverAttraction: setHoveredAttraction,
                    removeAttraction: (attractionId) =>
                      removeAttraction(block.id, attractionId),
                    reorderAttractions: (attractions) =>
                      reorderAttractions(block.id, attractions),
                  }}
                />
              );
            }}
          />
        )}

        {planBlocks.length === 0 && (
          <Empty className="border-gray-200 bg-gray-50">
            <EmptyHeader>
              <EmptyTitle>No plans in your itinerary yet</EmptyTitle>
              <EmptyDescription>
                Add your first plan to start placing attractions on the map.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={() => addBlock()}>
                <Plus className="h-4 w-4" />
                Add first plan
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </div>

      <div className="relative min-h-[45vh] overflow-hidden border-t border-gray-200 lg:min-h-0 lg:border-t-0">
        <AttractionMapToolbar filters={filters} />
        <ItineraryMap
          className="h-full rounded-none border-0 shadow-none lg:rounded-none lg:border-0 lg:shadow-none"
          attractions={mapAttractions}
          selectedBlockAttractions={selectedBlockAttractions}
          selectedBlockId={selectedBlockId}
          selectedAttractionId={selectedAttractionId}
          attractionToBlockMap={attractionToBlockMap}
          blockColors={blockColors}
          hoveredAttractionId={hoveredAttraction}
          blockRoutes={blockRoutes}
          overnightLegs={overnightLegs}
          isLoadingRoutes={isLoadingRoutes}
          overnightStops={trip.overnightStops}
          markerMeta={markerMeta}
          onAttractionSelect={handleSelectAttraction}
          onAddAttractionToBlock={handleAddAttractionToBlock}
          tripsImageSource="map-itinerary"
        />
      </div>
    </div>
  );
}
