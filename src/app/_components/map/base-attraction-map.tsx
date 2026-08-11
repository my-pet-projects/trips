"use client";

import "~/lib/map/leaflet-styles";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { circleMarkerVisual } from "~/lib/map/circle-marker-descriptor";
import { overnightStopDivIcon } from "~/lib/map/marker-icons/overnight-stop";
import type { MarkerMeta } from "~/lib/map/marker-meta";
import { useMarkerClusterGroup } from "~/lib/map/use-marker-cluster-group";
import { useMarkerLayer } from "~/lib/map/use-marker-layer";
import type {
  AttractionDetail,
  AttractionSummary,
  BasicAttraction,
  LabeledConnectorRoute,
  OvernightStop,
  RouteData,
} from "~/types";

import { AttractionDetailPanel } from "./attraction-detail-panel";
import { LeafletMapCanvas } from "./leaflet-map-core";
import {
  EMPTY_ATTRACTION_TO_BLOCK,
  EMPTY_BASIC_ATTRACTIONS,
  EMPTY_BLOCK_COLORS,
  EMPTY_BLOCK_ORDERS,
  EMPTY_BLOCK_ROUTES,
  EMPTY_LABELED_CONNECTOR_ROUTES,
  EMPTY_OVERNIGHT_STOPS,
} from "./map-constants";
import { useGeolocationTracking } from "./use-geolocation-tracking";
import { useLeafletMap } from "./use-leaflet-map";
import { useLeafletRoutes } from "./use-leaflet-routes";
import { useMapCenteringAndBounds } from "./use-map-centering-and-bounds";

export type AttractionMapStatus = {
  blockId: number | undefined;
  isInAnyBlock: boolean;
  isInSelectedBlock: boolean;
};

/**
 * Everything that only applies when the map is embedded in the itinerary
 * planner/viewer (day blocks, routes, geolocation). The browse map omits this
 * entirely and each field falls back to an empty/off default.
 */
export type ItineraryMapFeatures = {
  selectedBlockAttractions?: BasicAttraction[];
  selectedBlockId?: number | null;
  overnightStops?: OvernightStop[];
  attractionToBlockMap?: Map<number, number>;
  blockColors?: Map<number, string>;
  hoveredAttractionId?: number | null;
  blockRoutes?: Map<number, RouteData>;
  labeledConnectorRoutes?: LabeledConnectorRoute[];
  selectedBlockAttractionOrders?: Map<number, number>;
  isLoadingRoutes?: boolean;
  enableLocationTracking?: boolean;
  resolveAttractionStatus?: (
    attraction: AttractionDetail,
  ) => AttractionMapStatus;
  onAddToPlan?: (attraction: AttractionDetail) => void;
};

export type AttractionMapMarkers = {
  onClick: (attraction: AttractionSummary) => void;
  enableClustering?: boolean;
  meta?: Map<number, MarkerMeta>;
};

export type BaseAttractionMapProps = {
  attractions: AttractionSummary[] | AttractionDetail[];
  selectedAttractionId: number | null;
  selectedAttractionDetail?: AttractionDetail | null;
  onAttractionSelect: (attractionId: number | null) => void;
  onHighlightChange?: (
    attractionId: number,
    highlight: "must_see" | "recommended" | "skip" | null,
  ) => void;
  onDeleteAttraction?: (attractionId: number) => void;
  className?: string;
  markers: AttractionMapMarkers;
  itinerary?: ItineraryMapFeatures;
};

/**
 * The base Leaflet map plus its attraction detail panel, shared by the browse
 * and itinerary surfaces. Itinerary-only concerns (day blocks, routes,
 * geolocation) default to empty/off, so the browse map simply omits them.
 */
export default function BaseAttractionMap({
  attractions,
  selectedAttractionId,
  selectedAttractionDetail,
  onAttractionSelect,
  onHighlightChange,
  onDeleteAttraction,
  className,
  markers,
  itinerary,
}: BaseAttractionMapProps) {
  const {
    onClick: onMarkerClick,
    enableClustering = false,
    meta: markerMeta,
  } = markers;
  const {
    selectedBlockAttractions = EMPTY_BASIC_ATTRACTIONS,
    selectedBlockId = null,
    overnightStops = EMPTY_OVERNIGHT_STOPS,
    attractionToBlockMap = EMPTY_ATTRACTION_TO_BLOCK,
    blockColors = EMPTY_BLOCK_COLORS,
    hoveredAttractionId = null,
    blockRoutes = EMPTY_BLOCK_ROUTES,
    labeledConnectorRoutes = EMPTY_LABELED_CONNECTOR_ROUTES,
    selectedBlockAttractionOrders = EMPTY_BLOCK_ORDERS,
    enableLocationTracking = false,
    isLoadingRoutes = false,
    resolveAttractionStatus,
    onAddToPlan,
  } = itinerary ?? {};

  const attractionsMap = useMemo(
    () => new Map(attractions.map((a) => [a.id, a])),
    [attractions],
  );

  const [panelAttraction, setPanelAttraction] =
    useState<AttractionDetail | null>(null);
  const [panelHeight, setPanelHeight] = useState(0);

  useEffect(() => {
    if (selectedAttractionDetail) {
      setPanelAttraction(selectedAttractionDetail);
      return;
    }
    if (!selectedAttractionId) return;
    const fromMap = attractionsMap.get(selectedAttractionId);
    if (fromMap && "city" in fromMap) {
      setPanelAttraction(fromMap as AttractionDetail);
    } else {
      // A new marker is selected but its detail hasn't loaded yet (browse map
      // passes summaries without `city`). Drop stale content so the panel never
      // shows the previously-selected attraction under the new selection.
      setPanelAttraction((prev) =>
        prev && prev.id !== selectedAttractionId ? null : prev,
      );
    }
  }, [selectedAttractionDetail, selectedAttractionId, attractionsMap]);

  const handleClose = useCallback(() => {
    onAttractionSelect(null);
  }, [onAttractionSelect]);

  const handlePanelClosed = useCallback(() => {
    setPanelAttraction(null);
  }, []);

  const attractionStatus = useMemo(() => {
    if (!panelAttraction) return null;
    return (
      resolveAttractionStatus?.(panelAttraction) ?? {
        blockId: undefined,
        isInAnyBlock: false,
        isInSelectedBlock: false,
      }
    );
  }, [panelAttraction, resolveAttractionStatus]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const attractionList = attractions as AttractionSummary[];
  const { mapRef, hasInitializedBounds, mapReady } = useLeafletMap(
    containerRef,
    attractionList,
  );

  const markerItems = useMemo(() => {
    const map = new Map<number, AttractionSummary>();
    for (const a of attractionList) {
      if (a.latitude != null && a.longitude != null) map.set(a.id, a);
    }
    return map;
  }, [attractionList]);

  const { clusterRef, clusterGen } = useMarkerClusterGroup(
    mapRef,
    enableClustering,
    mapReady,
  );

  const getMarkerVisual = useCallback(
    (a: AttractionSummary) =>
      circleMarkerVisual(a.id, {
        attractionToBlockMap,
        blockColors,
        selectedBlockId,
        selectedBlockAttractionOrders,
        markerMeta,
        hoveredAttractionId,
        selectedAttractionId,
      }),
    [
      attractionToBlockMap,
      blockColors,
      selectedBlockId,
      selectedBlockAttractionOrders,
      markerMeta,
      hoveredAttractionId,
      selectedAttractionId,
    ],
  );

  useMarkerLayer<AttractionSummary>({
    clusterRef,
    clusterGen,
    mapRef,
    mapReady,
    items: markerItems,
    getLatLng: (a) => [a.latitude!, a.longitude!],
    getLabel: (a) => a.name,
    getVisual: getMarkerVisual,
    onSelect: onMarkerClick,
    stopClickPropagation: true,
  });

  const validOvernightStops = useMemo(
    () =>
      overnightStops.filter(
        (stop) =>
          stop.latitude != null &&
          Number.isFinite(stop.latitude) &&
          stop.latitude >= -90 &&
          stop.latitude <= 90 &&
          stop.longitude != null &&
          Number.isFinite(stop.longitude) &&
          stop.longitude >= -180 &&
          stop.longitude <= 180,
      ),
    [overnightStops],
  );
  const overnightStopItems = useMemo(
    () => new Map(validOvernightStops.map((stop) => [stop.id, stop])),
    [validOvernightStops],
  );
  const overnightStopPoints = useMemo(
    () =>
      validOvernightStops.map(
        (stop) => [stop.latitude, stop.longitude] as [number, number],
      ),
    [validOvernightStops],
  );
  const getOvernightStopVisual = useCallback(
    () => ({ icon: overnightStopDivIcon(), zIndexOffset: 250 }),
    [],
  );
  const ignoreOvernightStopSelection = useCallback(() => undefined, []);

  useMarkerLayer<OvernightStop>({
    mapRef,
    mapReady,
    items: overnightStopItems,
    getLatLng: (stop) => [stop.latitude, stop.longitude],
    getLabel: (stop) => stop.name,
    getVisual: getOvernightStopVisual,
    onSelect: ignoreOvernightStopSelection,
    stopClickPropagation: true,
  });

  useLeafletRoutes(
    mapRef,
    blockRoutes,
    labeledConnectorRoutes,
    blockColors,
    selectedBlockId,
    hoveredAttractionId,
    selectedAttractionId,
    isLoadingRoutes,
  );

  const {
    userLocation,
    isTrackingLocation,
    toggleLocationTracking,
    centerOnUserLocation,
  } = useGeolocationTracking(mapRef, enableLocationTracking);

  useMapCenteringAndBounds({
    mapRef,
    hasInitializedBounds,
    attractions: attractionList,
    attractionsMap,
    selectedBlockAttractions,
    selectedBlockId,
    selectedAttractionId,
    panelHeight,
    userLocation,
    additionalPoints: overnightStopPoints,
  });

  const showLoadingRoutesMessage =
    isLoadingRoutes && !!selectedBlockId && selectedBlockAttractions.length > 0;

  return (
    <div
      className={`relative h-full overflow-hidden ${className ?? "rounded-lg border border-gray-200 bg-white shadow-sm"}`}
    >
      <LeafletMapCanvas
        containerRef={containerRef}
        enableLocationTracking={enableLocationTracking}
        isTrackingLocation={isTrackingLocation}
        toggleLocationTracking={toggleLocationTracking}
        userLocation={userLocation}
        centerOnUserLocation={centerOnUserLocation}
        showLoadingRoutesMessage={showLoadingRoutesMessage}
      />

      {panelAttraction && attractionStatus && (
        <AttractionDetailPanel
          attraction={panelAttraction}
          attractionStatus={attractionStatus}
          selectedBlockId={selectedBlockId}
          isOpen={!!selectedAttractionId}
          onClose={handleClose}
          onClosed={handlePanelClosed}
          onAddToPlan={
            onAddToPlan && panelAttraction
              ? () => onAddToPlan(panelAttraction)
              : undefined
          }
          onPanelHeightChange={setPanelHeight}
          onHighlightChange={onHighlightChange}
          onDelete={onDeleteAttraction}
        />
      )}
    </div>
  );
}
