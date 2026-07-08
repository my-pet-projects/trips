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
  attractionToBlockMap: Map<number, number>,
  blockColors: Map<number, string>,
  selectedBlockId: number | null,
  selectedBlockAttractionOrders: Map<number, number>,
  markerMeta: Map<number, MarkerMeta> | undefined,
  hoveredAttractionId: number | null,
  selectedAttractionId: number | null,
) {
  const attraction = attractionsMap.get(attractionId);
  const attractionBlockId = attractionToBlockMap.get(attractionId);
  const isInAnyBlock = attractionBlockId !== undefined;
  const isInSelectedBlock = attractionBlockId === selectedBlockId;
  const isHovered = hoveredAttractionId === attractionId;
  const isSelected = selectedAttractionId === attractionId;
  const meta = markerMeta?.get(attractionId);
  const color = getCircleMarkerColor(attractionId, markerMeta, attractionToBlockMap, blockColors);

  return {
    attraction,
    color,
    isInAnyBlock,
    isInSelectedBlock,
    isHovered,
    isSelected,
    orderNumber: selectedBlockAttractionOrders.get(attractionId),
    isVerified: meta?.isVerified && !isInAnyBlock,
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
  attractionToBlockMap: Map<number, number>;
  blockColors: Map<number, string>;
  selectedBlockId: number | null;
  selectedBlockAttractionOrders: Map<number, number>;
  markerMeta: Map<number, MarkerMeta> | undefined;
  hoveredAttractionId: number | null;
  selectedAttractionId: number | null;
  enableClustering: boolean;
};

export function useCircleMarkerVisuals({
  mapRef,
  markersRef,
  attractionsMap,
  attractionToBlockMap,
  blockColors,
  selectedBlockId,
  selectedBlockAttractionOrders,
  markerMeta,
  hoveredAttractionId,
  selectedAttractionId,
  enableClustering,
}: UseCircleMarkerVisualsOptions) {
  useEffect(() => {
    if (!mapRef.current) return;
    if (enableClustering && attractionToBlockMap.size === 0 && blockColors.size === 0 && !markerMeta) {
      return;
    }

    for (const [id, marker] of markersRef.current) {
      const visual = getMarkerVisualState(
        id,
        attractionsMap,
        attractionToBlockMap,
        blockColors,
        selectedBlockId,
        selectedBlockAttractionOrders,
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
          isInBlock: visual.isInAnyBlock,
          isHighlighted: visual.isHovered || visual.isSelected,
          orderNumber: visual.isInSelectedBlock ? visual.orderNumber : undefined,
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
    attractionToBlockMap,
    blockColors,
    selectedBlockId,
    selectedBlockAttractionOrders,
    markerMeta,
    hoveredAttractionId,
    selectedAttractionId,
    mapRef,
    markersRef,
    enableClustering,
  ]);
}
