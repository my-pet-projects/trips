"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MapDynamicLoading } from "~/lib/map/map-loading";
import type {
  AttractionDetail,
  AttractionSummary,
  BasicAttraction,
  RouteData,
} from "~/types";
import { AttractionDetailPanel } from "./attraction-detail-panel";
import type { MarkerMeta } from "./hooks/useLeafletMarkers";

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
  onHighlightChange?: (attractionId: number, highlight: "must_see" | "recommended" | "skip" | null) => void;
  onDeleteAttraction?: (attractionId: number) => void;
  enableLocationTracking?: boolean;
  enableClustering?: boolean;
  isLoadingRoutes: boolean;
  className?: string;
  markerMeta?: Map<number, MarkerMeta>;
};

const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => <MapDynamicLoading label="Loading map…" />,
});

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
}: ItineraryMapProps) {
  const attractionsMap = useMemo(() => {
    return new Map(attractions.map((a) => [a.id, a]));
  }, [attractions]);

  const [panelAttraction, setPanelAttraction] =
    useState<AttractionDetail | null>(null);
  const [panelHeight, setPanelHeight] = useState(0);

  useEffect(() => {
    if (selectedAttractionDetail) {
      setPanelAttraction(selectedAttractionDetail);
    } else if (selectedAttractionId) {
      const fromMap = attractionsMap.get(selectedAttractionId);
      if (fromMap && "city" in fromMap) setPanelAttraction(fromMap as AttractionDetail);
    }
  }, [selectedAttractionDetail, selectedAttractionId, attractionsMap]);

  const isPanelOpen = !!selectedAttractionId;

  const attractionToDayMap = useMemo(() => {
    const map = new Map<number, number>();
    allDaysAttractions.forEach((dayAttractions, dayId) => {
      dayAttractions.forEach((attraction) => {
        map.set(attraction.id, dayId);
      });
    });
    return map;
  }, [allDaysAttractions]);

  const selectedDayAttractionOrders = useMemo(() => {
    const map = new Map<number, number>();
    selectedDayAttractions.forEach((attr, index) => {
      map.set(attr.id, index + 1);
    });
    return map;
  }, [selectedDayAttractions]);

  const handleMarkerClick = useCallback(
    (attraction: AttractionSummary) => {
      onAttractionSelect(attraction.id);
    },
    [onAttractionSelect],
  );

  const handleAddToDay = useCallback(() => {
    if (panelAttraction) {
      onAddAttractionToDay?.(panelAttraction);
    }
  }, [panelAttraction, onAddAttractionToDay]);

  const handleClose = useCallback(() => {
    onAttractionSelect(null);
  }, [onAttractionSelect]);

  const handlePanelClosed = useCallback(() => {
    setPanelAttraction(null);
  }, []);

  const attractionStatus = useMemo(() => {
    if (!panelAttraction) return null;

    const dayId = attractionToDayMap.get(panelAttraction.id);
    return {
      dayId,
      isInAnyDay: dayId !== undefined,
      isInSelectedDay: dayId === selectedDayId,
    };
  }, [panelAttraction, attractionToDayMap, selectedDayId]);

  return (
    <div
      className={`relative h-full overflow-hidden ${className ?? "rounded-lg border border-gray-200 bg-white shadow-sm"}`}
    >
      <LeafletMap
        key="map"
        attractions={attractions}
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

      {panelAttraction && attractionStatus && (
        <AttractionDetailPanel
          attraction={panelAttraction}
          attractionStatus={attractionStatus}
          selectedDayId={selectedDayId}
          isOpen={isPanelOpen}
          onClose={handleClose}
          onClosed={handlePanelClosed}
          onAddToDay={onAddAttractionToDay ? handleAddToDay : undefined}
          onPanelHeightChange={setPanelHeight}
          onHighlightChange={onHighlightChange}
          onDelete={onDeleteAttraction}
        />
      )}
    </div>
  );
}
