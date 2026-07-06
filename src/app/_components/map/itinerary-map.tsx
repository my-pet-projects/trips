"use client";

import dynamic from "next/dynamic";
import { useCallback } from "react";

import { useItineraryRouteMap } from "~/lib/itinerary/use-itinerary-route-map";
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
  ItineraryDayData,
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
  itineraryDays: ItineraryDayData[];
  onAttractionSelect: (attractionId: number | null) => void;
  onAddAttractionToDay?: (attraction: AttractionDetail) => void;
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
  selectedDayAttractions,
  selectedDayId,
  selectedAttractionId,
  allDaysAttractions,
  dayColors,
  hoveredAttractionId,
  itineraryDays,
  onAttractionSelect,
  onAddAttractionToDay,
  onHighlightChange,
  onDeleteAttraction,
  enableLocationTracking = false,
  enableClustering = false,
  className,
  markerMeta,
  tripsImageSource,
}: ItineraryMapProps) {
  const { dayRoutes, isLoadingRoutes } = useItineraryRouteMap(itineraryDays);

  const { attractionToDayMap, selectedDayAttractionOrders, resolveAttractionStatus } =
    useItineraryMapDerivedState(allDaysAttractions, selectedDayAttractions, selectedDayId);

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
