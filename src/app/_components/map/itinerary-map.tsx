"use client";

import { dynamicMap } from "~/lib/map/dynamic-map";
import { usePlanBlockRouteMap } from "~/lib/itinerary/use-plan-block-route-map";
import type { MarkerMeta } from "~/lib/map/marker-meta";
import type { TripsImageSource } from "~/lib/trips-image-extension";
import type {
  AttractionDetail,
  BasicAttraction,
  OvernightStop,
  PlanBlock,
} from "~/types";

import type { BaseAttractionMapProps } from "./base-attraction-map";
import { useMarkerSelect } from "./use-marker-select";
import { usePlanBlockMapDerivedState } from "./use-plan-block-map-derived-state";

const BaseAttractionMap = dynamicMap<BaseAttractionMapProps>(
  () => import("./base-attraction-map"),
);

/** Raw plan-block state the itinerary passes in; the rest is forwarded to the
 * base map unchanged (see the `Pick`). */
type ItineraryMapProps = Pick<
  BaseAttractionMapProps,
  | "attractions"
  | "selectedAttractionId"
  | "selectedAttractionDetail"
  | "onAttractionSelect"
  | "onHighlightChange"
  | "onDeleteAttraction"
  | "className"
> & {
  planBlocks: PlanBlock[];
  overnightStops: OvernightStop[];
  selectedBlockAttractions: BasicAttraction[];
  selectedBlockId: number | null;
  attractionToBlockMap: Map<number, PlanBlock>;
  blockColors: Map<number, string>;
  hoveredAttractionId: number | null;
  onAddAttractionToBlock?: (attraction: AttractionDetail) => void;
  enableLocationTracking?: boolean;
  enableClustering?: boolean;
  markerMeta?: Map<number, MarkerMeta>;
  tripsImageSource: TripsImageSource;
};

export function ItineraryMap({
  planBlocks,
  overnightStops,
  selectedBlockAttractions,
  selectedBlockId,
  attractionToBlockMap,
  blockColors,
  hoveredAttractionId,
  onAddAttractionToBlock,
  enableLocationTracking = false,
  enableClustering = false,
  markerMeta,
  tripsImageSource,
  ...base
}: ItineraryMapProps) {
  const { blockRoutes, isLoadingRoutes } = usePlanBlockRouteMap(planBlocks);

  const {
    attractionToBlockId,
    selectedBlockAttractionOrders,
    resolveAttractionStatus,
  } = usePlanBlockMapDerivedState(
    attractionToBlockMap,
    selectedBlockAttractions,
    selectedBlockId,
  );

  const handleMarkerClick = useMarkerSelect(
    tripsImageSource,
    base.onAttractionSelect,
  );

  return (
    <BaseAttractionMap
      {...base}
      markers={{
        onClick: handleMarkerClick,
        enableClustering,
        meta: markerMeta,
      }}
      itinerary={{
        selectedBlockAttractions,
        selectedBlockId,
        overnightStops,
        selectedBlockAttractionOrders,
        attractionToBlockMap: attractionToBlockId,
        blockColors,
        hoveredAttractionId,
        blockRoutes,
        isLoadingRoutes,
        enableLocationTracking,
        resolveAttractionStatus,
        onAddToPlan: onAddAttractionToBlock,
      }}
    />
  );
}
