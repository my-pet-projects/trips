import type L from "leaflet";
import { useEffect, type RefObject } from "react";

import {
  BASE_CIRCLE_MARKER_SIZE,
  applyCircleMarkerIcon,
  createCircleMarkerIcon,
  type CircleTaggedMarker,
} from "~/lib/map/marker-icons/circle";
import { getCircleMarkerColor, type MarkerMeta } from "~/lib/map/marker-meta";

import type { AttractionSummary } from "~/types";

function getMarkerVisualState(
  attractionId: number,
  attractionsMap: Map<number, AttractionSummary>,
  attractionToDayMap: Map<number, number>,
  dayColors: Map<number, string>,
  selectedDayId: number | null,
  selectedDayAttractionOrders: Map<number, number>,
  markerMeta: Map<number, MarkerMeta> | undefined,
  hoveredAttractionId: number | null,
  selectedAttractionId: number | null,
) {
  const attraction = attractionsMap.get(attractionId);
  const attractionDayId = attractionToDayMap.get(attractionId);
  const isInAnyDay = attractionDayId !== undefined;
  const isInSelectedDay = attractionDayId === selectedDayId;
  const isHovered = hoveredAttractionId === attractionId;
  const isSelected = selectedAttractionId === attractionId;
  const meta = markerMeta?.get(attractionId);
  const color = getCircleMarkerColor(attractionId, markerMeta, attractionToDayMap, dayColors);

  return {
    attraction,
    color,
    isInAnyDay,
    isInSelectedDay,
    isHovered,
    isSelected,
    orderNumber: selectedDayAttractionOrders.get(attractionId),
    isVerified: meta?.isVerified && !isInAnyDay,
    size: isSelected
      ? BASE_CIRCLE_MARKER_SIZE + 8
      : isHovered
        ? BASE_CIRCLE_MARKER_SIZE + 4
        : BASE_CIRCLE_MARKER_SIZE,
    zIndexOffset: isSelected ? 1000 : isHovered ? 500 : 0,
  };
}

type UseCircleMarkerVisualsOptions = {
  mapRef: RefObject<L.Map | null>;
  markersRef: RefObject<Map<number, L.Marker>>;
  attractionsMap: Map<number, AttractionSummary>;
  attractionToDayMap: Map<number, number>;
  dayColors: Map<number, string>;
  selectedDayId: number | null;
  selectedDayAttractionOrders: Map<number, number>;
  markerMeta: Map<number, MarkerMeta> | undefined;
  hoveredAttractionId: number | null;
  selectedAttractionId: number | null;
  enableClustering: boolean;
};

export function useCircleMarkerVisuals({
  mapRef,
  markersRef,
  attractionsMap,
  attractionToDayMap,
  dayColors,
  selectedDayId,
  selectedDayAttractionOrders,
  markerMeta,
  hoveredAttractionId,
  selectedAttractionId,
  enableClustering,
}: UseCircleMarkerVisualsOptions) {
  useEffect(() => {
    if (!mapRef.current) return;
    if (enableClustering && attractionToDayMap.size === 0 && dayColors.size === 0 && !markerMeta) {
      return;
    }

    for (const [id, marker] of markersRef.current) {
      const visual = getMarkerVisualState(
        id,
        attractionsMap,
        attractionToDayMap,
        dayColors,
        selectedDayId,
        selectedDayAttractionOrders,
        markerMeta,
        hoveredAttractionId,
        selectedAttractionId,
      );
      if (!visual.attraction) continue;

      applyCircleMarkerIcon(
        marker,
        createCircleMarkerIcon({
          color: visual.color,
          size: visual.size,
          isInDay: visual.isInAnyDay,
          isHighlighted: visual.isHovered || visual.isSelected,
          orderNumber: visual.isInSelectedDay ? visual.orderNumber : undefined,
          isVerified: visual.isVerified,
        }),
      );
      const meta = markerMeta?.get(id);
      const tagged = marker as CircleTaggedMarker;
      if (meta) {
        tagged._metaTag = meta.tag;
        tagged._metaColor = meta.color;
      } else {
        delete tagged._metaTag;
        delete tagged._metaColor;
      }
      marker.setZIndexOffset(visual.zIndexOffset);
    }
  }, [
    attractionsMap,
    attractionToDayMap,
    dayColors,
    selectedDayId,
    selectedDayAttractionOrders,
    markerMeta,
    hoveredAttractionId,
    selectedAttractionId,
    mapRef,
    markersRef,
    enableClustering,
  ]);
}
