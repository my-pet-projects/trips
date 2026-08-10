"use client";

import { dynamicMap } from "~/lib/map/dynamic-map";
import type { MarkerMeta } from "~/lib/map/marker-meta";
import type { TripsImageSource } from "~/lib/trips-image-extension";
import type {
  AttractionDetail,
  BasicAttraction,
  OvernightLegResult,
  OvernightStop,
  PlanBlock,
  RouteData,
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
  selectedBlockAttractions: BasicAttraction[];
  selectedBlockId: number | null;
  attractionToBlockMap: Map<number, PlanBlock>;
  blockColors: Map<number, string>;
  hoveredAttractionId: number | null;
  blockRoutes: Map<number, RouteData>;
  overnightLegs: Map<number, OvernightLegResult>;
  overnightStops: OvernightStop[];
  isLoadingRoutes: boolean;
  onAddAttractionToBlock?: (attraction: AttractionDetail) => void;
  enableLocationTracking?: boolean;
  enableClustering?: boolean;
  markerMeta?: Map<number, MarkerMeta>;
  tripsImageSource: TripsImageSource;
};

export function ItineraryMap({
  selectedBlockAttractions,
  selectedBlockId,
  attractionToBlockMap,
  blockColors,
  hoveredAttractionId,
  blockRoutes,
  overnightLegs,
  overnightStops,
  isLoadingRoutes,
  onAddAttractionToBlock,
  enableLocationTracking = false,
  enableClustering = false,
  markerMeta,
  tripsImageSource,
  ...base
}: ItineraryMapProps) {
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
        overnightLegs,
        enableLocationTracking,
        resolveAttractionStatus,
        onAddToPlan: onAddAttractionToBlock,
      }}
    />
  );
}
