"use client";

import dynamic from "next/dynamic";
import { useCallback } from "react";

import { usePlanBlockRouteMap } from "~/lib/itinerary/use-plan-block-route-map";
import { MapDynamicLoading } from "~/lib/map/map-loading";
import type { MarkerMeta } from "~/lib/map/marker-meta";
import {
  notifyTripsImageExtension,
  type TripsImageSource,
} from "~/lib/trips-image-extension";
import type {
  AttractionDetail,
  AttractionSummary,
  BasicAttraction,
  PlanBlock,
} from "~/types";

import { AttractionMapShell } from "./attraction-map-shell";
import { usePlanBlockMapDerivedState } from "./use-plan-block-map-derived-state";

const ItineraryLeafletMap = dynamic(
  () => import("./itinerary-leaflet-map"),
  {
    ssr: false,
    loading: () => <MapDynamicLoading label="Loading map…" />,
  },
);

type ItineraryMapProps = {
  attractions: AttractionSummary[] | AttractionDetail[];
  selectedAttractionDetail?: AttractionDetail | null;
  selectedBlockAttractions: BasicAttraction[];
  selectedBlockId: number | null;
  selectedAttractionId: number | null;
  allBlocksAttractions: Map<number, BasicAttraction[]>;
  blockColors: Map<number, string>;
  hoveredAttractionId: number | null;
  planBlocks: PlanBlock[];
  onAttractionSelect: (attractionId: number | null) => void;
  onAddAttractionToBlock?: (attraction: AttractionDetail) => void;
  onHighlightChange?: (
    attractionId: number,
    highlight: "must_see" | "recommended" | "skip" | null,
  ) => void;
  onDeleteAttraction?: (attractionId: number) => void;
  enableLocationTracking?: boolean;
  enableClustering?: boolean;
  className?: string;
  markerMeta?: Map<number, MarkerMeta>;
  tripsImageSource: TripsImageSource;
};

export function ItineraryMap({
  attractions,
  selectedAttractionDetail,
  selectedBlockAttractions,
  selectedBlockId,
  selectedAttractionId,
  allBlocksAttractions,
  blockColors,
  hoveredAttractionId,
  planBlocks,
  onAttractionSelect,
  onAddAttractionToBlock,
  onHighlightChange,
  onDeleteAttraction,
  enableLocationTracking = false,
  enableClustering = false,
  className,
  markerMeta,
  tripsImageSource,
}: ItineraryMapProps) {
  const { blockRoutes, isLoadingRoutes } = usePlanBlockRouteMap(planBlocks);

  const {
    attractionToBlockMap,
    selectedBlockAttractionOrders,
    resolveAttractionStatus,
  } = usePlanBlockMapDerivedState(
    allBlocksAttractions,
    selectedBlockAttractions,
    selectedBlockId,
  );

  const handleMarkerClick = useCallback(
    (attraction: AttractionSummary) => {
      notifyTripsImageExtension(tripsImageSource, attraction);
      onAttractionSelect(attraction.id);
    },
    [tripsImageSource, onAttractionSelect],
  );

  return (
    <AttractionMapShell
      attractions={attractions}
      selectedAttractionId={selectedAttractionId}
      selectedAttractionDetail={selectedAttractionDetail}
      onAttractionSelect={onAttractionSelect}
      onHighlightChange={onHighlightChange}
      onDeleteAttraction={onDeleteAttraction}
      onAddToPlan={onAddAttractionToBlock}
      selectedBlockId={selectedBlockId}
      resolveAttractionStatus={resolveAttractionStatus}
      className={className}
    >
      {(panelHeight, attractionsMap) => (
        <ItineraryLeafletMap
          attractions={attractions as AttractionSummary[]}
          attractionsMap={attractionsMap}
          selectedBlockAttractions={selectedBlockAttractions}
          selectedBlockId={selectedBlockId}
          selectedBlockAttractionOrders={selectedBlockAttractionOrders}
          attractionToBlockMap={attractionToBlockMap}
          blockColors={blockColors}
          hoveredAttractionId={hoveredAttractionId}
          selectedAttractionId={selectedAttractionId}
          panelHeight={panelHeight}
          blockRoutes={blockRoutes}
          onMarkerClick={handleMarkerClick}
          enableLocationTracking={enableLocationTracking}
          enableClustering={enableClustering}
          isLoadingRoutes={isLoadingRoutes}
          markerMeta={markerMeta}
        />
      )}
    </AttractionMapShell>
  );
}
