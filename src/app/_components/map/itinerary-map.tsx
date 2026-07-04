"use client";

import dynamic from "next/dynamic";
import { useCallback } from "react";

import { MapDynamicLoading } from "~/lib/map/map-loading";
import {
  notifyMapExtensionSelection,
  type MapExtensionContext,
} from "~/lib/map/map-extension-bridge";
import type { MarkerMeta } from "~/lib/map/marker-meta";
import type {
  AttractionDetail,
  AttractionSummary,
  BasicAttraction,
  RouteData,
} from "~/types";

import { AttractionMapShell } from "./attraction-map-shell";
import { useItineraryMapDerivedState } from "./use-itinerary-map-derived-state";

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
  selectedDayAttractions: BasicAttraction[];
  selectedDayId: number | null;
  selectedAttractionId: number | null;
  allDaysAttractions: Map<number, BasicAttraction[]>;
  dayColors: Map<number, string>;
  hoveredAttractionId: number | null;
  dayRoutes: Map<number, RouteData>;
  onAttractionSelect: (attractionId: number | null) => void;
  onAddAttractionToDay?: (attraction: AttractionDetail) => void;
  onHighlightChange?: (
    attractionId: number,
    highlight: "must_see" | "recommended" | "skip" | null,
  ) => void;
  onDeleteAttraction?: (attractionId: number) => void;
  enableLocationTracking?: boolean;
  enableClustering?: boolean;
  isLoadingRoutes: boolean;
  className?: string;
  markerMeta?: Map<number, MarkerMeta>;
  extensionMapContext?: MapExtensionContext;
};

export function ItineraryMap({
  attractions,
  selectedAttractionDetail,
  selectedDayAttractions,
  selectedDayId,
  selectedAttractionId,
  allDaysAttractions,
  dayColors,
  hoveredAttractionId,
  dayRoutes,
  onAttractionSelect,
  onAddAttractionToDay,
  onHighlightChange,
  onDeleteAttraction,
  enableLocationTracking = false,
  enableClustering = false,
  isLoadingRoutes,
  className,
  markerMeta,
  extensionMapContext,
}: ItineraryMapProps) {
  const { attractionToDayMap, selectedDayAttractionOrders, resolveAttractionStatus } =
    useItineraryMapDerivedState(allDaysAttractions, selectedDayAttractions, selectedDayId);

  const handleMarkerClick = useCallback(
    (attraction: AttractionSummary) => {
      if (extensionMapContext) {
        notifyMapExtensionSelection(extensionMapContext, attraction);
      }
      onAttractionSelect(attraction.id);
    },
    [extensionMapContext, onAttractionSelect],
  );

  return (
    <AttractionMapShell
      attractions={attractions}
      selectedAttractionId={selectedAttractionId}
      selectedAttractionDetail={selectedAttractionDetail}
      onAttractionSelect={onAttractionSelect}
      onHighlightChange={onHighlightChange}
      onDeleteAttraction={onDeleteAttraction}
      onAddToDay={onAddAttractionToDay}
      selectedDayId={selectedDayId}
      resolveAttractionStatus={resolveAttractionStatus}
      className={className}
    >
      {(panelHeight, attractionsMap) => (
        <ItineraryLeafletMap
          attractions={attractions as AttractionSummary[]}
          attractionsMap={attractionsMap}
          selectedDayAttractions={selectedDayAttractions}
          selectedDayId={selectedDayId}
          selectedDayAttractionOrders={selectedDayAttractionOrders}
          attractionToDayMap={attractionToDayMap}
          dayColors={dayColors}
          hoveredAttractionId={hoveredAttractionId}
          selectedAttractionId={selectedAttractionId}
          panelHeight={panelHeight}
          dayRoutes={dayRoutes}
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
