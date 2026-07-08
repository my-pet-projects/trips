import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { useCallback, useMemo, useRef } from "react";

import { BROWSE_CLUSTER_PRESET } from "~/lib/map/cluster-presets";
import { createPieClusterIcon } from "~/lib/map/cluster-icon";
import {
  BASE_CIRCLE_MARKER_SIZE,
  DEFAULT_CIRCLE_COLOR,
  circleMarkerDivIcon,
  type CircleTaggedMarker,
} from "~/lib/map/marker-icons/circle";
import {
  getCircleMarkerColor,
  type MarkerMeta,
} from "~/lib/map/marker-meta";
import { bindMarkerTooltip } from "~/lib/map/marker-tooltip";
import { useMarkerClusterGroup } from "~/lib/map/use-marker-cluster-group";
import { useSyncedMarkers } from "~/lib/map/use-synced-markers";

import type { AttractionSummary } from "~/types";

import {
  EMPTY_ATTRACTION_TO_BLOCK,
  EMPTY_BLOCK_COLORS,
  EMPTY_BLOCK_ORDERS,
} from "./map-constants";
import { useCircleMarkerVisuals } from "./useCircleMarkerVisuals";

function createClusterIconWithMeta(
  markerMetaRef: React.RefObject<Map<number, MarkerMeta> | undefined>,
): (cluster: L.MarkerCluster) => L.DivIcon {
  return (cluster) =>
    createPieClusterIcon(
      cluster,
      (group) => {
        const meta = markerMetaRef.current;
        if (!meta || meta.size === 0) return [];

        const tally = new Map<string, { color: string; count: number }>();
        for (const m of group.getAllChildMarkers()) {
          const tag = (m as CircleTaggedMarker)._metaTag ?? "default";
          const color = (m as CircleTaggedMarker)._metaColor ?? DEFAULT_CIRCLE_COLOR;
          const entry = tally.get(tag);
          if (entry) entry.count++;
          else tally.set(tag, { color, count: 1 });
        }
        return [...tally.values()];
      },
      { fallbackColor: "#0ea5e9" },
    );
}

export type UseLeafletMarkersOptions = {
  mapRef: React.RefObject<L.Map | null>;
  mapReady: boolean;
  attractions: AttractionSummary[];
  attractionsMap: Map<number, AttractionSummary>;
  onMarkerClick: (attraction: AttractionSummary) => void;
  enableClustering?: boolean;
  markerMeta?: Map<number, MarkerMeta>;
  attractionToBlockMap?: Map<number, number>;
  blockColors?: Map<number, string>;
  hoveredAttractionId?: number | null;
  selectedAttractionId?: number | null;
  selectedBlockId?: number | null;
  selectedBlockAttractionOrders?: Map<number, number>;
};

export const useLeafletMarkers = ({
  mapRef,
  mapReady,
  attractions,
  attractionsMap,
  onMarkerClick,
  enableClustering = false,
  markerMeta,
  attractionToBlockMap = EMPTY_ATTRACTION_TO_BLOCK,
  blockColors = EMPTY_BLOCK_COLORS,
  hoveredAttractionId = null,
  selectedAttractionId = null,
  selectedBlockId = null,
  selectedBlockAttractionOrders = EMPTY_BLOCK_ORDERS,
}: UseLeafletMarkersOptions) => {
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const dataRef = useRef<Map<number, AttractionSummary>>(new Map());

  const onMarkerClickRef = useRef(onMarkerClick);
  onMarkerClickRef.current = onMarkerClick;
  const markerMetaRef = useRef(markerMeta);
  markerMetaRef.current = markerMeta;

  const itemsById = useMemo(() => {
    const map = new Map<number, AttractionSummary>();
    for (const attraction of attractions) {
      if (attraction.latitude != null && attraction.longitude != null) {
        map.set(attraction.id, attraction);
      }
    }
    return map;
  }, [attractions]);

  const clusterOptions = useMemo(
    () => ({
      ...BROWSE_CLUSTER_PRESET,
      iconCreateFunction: createClusterIconWithMeta(markerMetaRef),
    }),
    [],
  );

  const { clusterRef, clusterGen } = useMarkerClusterGroup(
    mapRef,
    clusterOptions,
    enableClustering,
    mapReady,
  );

  const createMarker = useCallback(
    (attraction: AttractionSummary) => {
      const meta = markerMetaRef.current?.get(attraction.id);
      const color = getCircleMarkerColor(
        attraction.id,
        markerMetaRef.current,
        attractionToBlockMap,
        blockColors,
      );
      const attractionBlockId = attractionToBlockMap.get(attraction.id);
      const isInAnyBlock = attractionBlockId !== undefined;
      const isInSelectedBlock = attractionBlockId === selectedBlockId;
      const orderNumber = selectedBlockAttractionOrders.get(attraction.id);

      const marker = L.marker([attraction.latitude!, attraction.longitude!], {
        icon: circleMarkerDivIcon({
          color,
          size: BASE_CIRCLE_MARKER_SIZE,
          isInBlock: isInAnyBlock,
          orderNumber: isInSelectedBlock ? orderNumber : undefined,
          isVerified: meta?.isVerified && !isInAnyBlock,
        }),
        zIndexOffset: 0,
        pane: "markerPane",
      });

      bindMarkerTooltip(marker, attraction.name);

      if (meta) {
        (marker as CircleTaggedMarker)._metaTag = meta.tag;
        (marker as CircleTaggedMarker)._metaColor = meta.color;
      }

      return marker;
    },
    [attractionToBlockMap, blockColors, selectedBlockId, selectedBlockAttractionOrders],
  );

  const bindClick = useCallback((marker: L.Marker, id: number) => {
    marker.off("click");
    marker.on("click", (e) => {
      L.DomEvent.stopPropagation(e);
      const attraction = dataRef.current.get(id);
      if (attraction) onMarkerClickRef.current(attraction);
    });
  }, []);

  useSyncedMarkers({
    clusterRef: enableClustering ? clusterRef : undefined,
    clusterGen: enableClustering ? clusterGen : undefined,
    mapRef: enableClustering ? undefined : mapRef,
    mapReady,
    items: itemsById,
    markersRef,
    dataRef,
    bindClick,
    createMarker,
  });

  useCircleMarkerVisuals({
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
  });

  return markersRef;
};
