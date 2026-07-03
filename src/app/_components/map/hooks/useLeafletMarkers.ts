import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { useEffect, useMemo, useRef } from "react";

import { createPieClusterIcon } from "~/lib/map/cluster-icon";
import { ATTRACTION_MARKER_COLORS } from "~/lib/map/marker-meta";
import type { MarkerMeta } from "~/lib/map/marker-meta";

import type { AttractionSummary } from "~/types";

export type { MarkerMeta };

type TaggedMarker = L.Marker & { _metaTag?: string };

const BASE_MARKER_SIZE = 26;
const DEFAULT_COLOR = "#9ca3af";
const VERIFIED_RING_WIDTH = 3;

type MarkerIconResult = { html: string; iconSize: number; iconAnchor: number };

const createMarkerIcon = (
  color: string,
  size: number,
  isInDay: boolean,
  isHighlighted: boolean,
  orderNumber?: number,
  isVerified = false,
): MarkerIconResult => {
  const showVerifiedRing = isVerified;
  const outerSize = showVerifiedRing ? size + VERIFIED_RING_WIDTH * 2 : size;

  const innerHtml = `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 ${isHighlighted ? "4" : "2"}px ${isHighlighted ? "12" : "8"}px rgba(0,0,0,${isHighlighted ? "0.4" : "0.3"});
        cursor: pointer;
        transition: all 0.2s ease;
        ${isHighlighted ? "transform: scale(1.15);" : ""}
        position: relative;
        overflow: hidden;
        flex-shrink: 0;
      ">
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: ${size > 28 ? "14px" : "12px"};
          line-height: 1;
          white-space: nowrap;
          text-align: center;
        ">
          ${orderNumber ?? (isInDay ? "●" : "")}
        </div>
      </div>`;

  const html = showVerifiedRing
    ? `<div style="
        width: ${outerSize}px;
        height: ${outerSize}px;
        border-radius: 50%;
        background: ${ATTRACTION_MARKER_COLORS.verified};
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        cursor: pointer;
      ">${innerHtml}</div>`
    : innerHtml;

  return { html, iconSize: outerSize, iconAnchor: outerSize / 2 };
};

function applyMarkerIcon(marker: L.Marker, icon: MarkerIconResult) {
  marker.setIcon(
    L.divIcon({
      html: icon.html,
      className: "custom-marker",
      iconSize: [icon.iconSize, icon.iconSize],
      iconAnchor: [icon.iconAnchor, icon.iconAnchor],
    }),
  );
}

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
          const tag = (m as TaggedMarker)._metaTag ?? "default";
          const color =
            (m as TaggedMarker & { _metaColor?: string })._metaColor ?? DEFAULT_COLOR;
          const entry = tally.get(tag);
          if (entry) entry.count++;
          else tally.set(tag, { color, count: 1 });
        }
        return [...tally.values()];
      },
      { fallbackColor: "#0ea5e9" },
    );
}

export const useLeafletMarkers = (
  mapRef: React.RefObject<L.Map | null>,
  attractions: AttractionSummary[],
  attractionsMap: Map<number, AttractionSummary>,
  attractionToDayMap: Map<number, number>,
  dayColors: Map<number, string>,
  hoveredAttractionId: number | null,
  selectedAttractionId: number | null,
  selectedDayId: number | null,
  selectedDayAttractionOrders: Map<number, number>,
  onMarkerClick: (attraction: AttractionSummary) => void,
  enableClustering = false,
  markerMeta?: Map<number, MarkerMeta>,
) => {
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const previousHoveredIdRef = useRef<number | null>(null);
  const previousSelectedIdRef = useRef<number | null>(null);

  const attractionIdsKey = useMemo(
    () =>
      attractions
        .map((a) => a.id)
        .sort((a, b) => a - b)
        .join(","),
    [attractions],
  );

  const onMarkerClickRef = useRef(onMarkerClick);
  onMarkerClickRef.current = onMarkerClick;
  const attractionToDayMapRef = useRef(attractionToDayMap);
  attractionToDayMapRef.current = attractionToDayMap;
  const dayColorsRef = useRef(dayColors);
  dayColorsRef.current = dayColors;
  const selectedDayIdRef = useRef(selectedDayId);
  selectedDayIdRef.current = selectedDayId;
  const selectedDayAttractionOrdersRef = useRef(selectedDayAttractionOrders);
  selectedDayAttractionOrdersRef.current = selectedDayAttractionOrders;
  const markerMetaRef = useRef(markerMeta);
  markerMetaRef.current = markerMeta;

  // Rebuild markers only when the visible ID set changes (not on every array reference change).
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const markers = markersRef.current;

    markers.forEach((marker) => marker.remove());
    markers.clear();
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }

    if (attractions.length === 0) return;

    let clusterGroup: L.MarkerClusterGroup | null = null;
    if (enableClustering) {
      clusterGroup = L.markerClusterGroup({
        iconCreateFunction: createClusterIconWithMeta(markerMetaRef),
        maxClusterRadius: 60,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        disableClusteringAtZoom: 16,
        animate: true,
      });
      clusterGroupRef.current = clusterGroup;
    }

    attractions.forEach((attraction) => {
      if (attraction.latitude == null || attraction.longitude == null) return;

      const attractionDayId = attractionToDayMapRef.current.get(attraction.id);
      const isInAnyDay = attractionDayId !== undefined;
      const isInSelectedDay = attractionDayId === selectedDayIdRef.current;
      const orderNumber = selectedDayAttractionOrdersRef.current.get(attraction.id);

      const meta = markerMetaRef.current?.get(attraction.id);
      let color = meta?.color ?? DEFAULT_COLOR;
      if (isInAnyDay) {
        color = dayColorsRef.current.get(attractionDayId!) ?? DEFAULT_COLOR;
      }

      const icon = createMarkerIcon(
        color,
        BASE_MARKER_SIZE,
        isInAnyDay,
        false,
        isInSelectedDay ? orderNumber : undefined,
        meta?.isVerified && !isInAnyDay,
      );
      const customIcon = L.divIcon({
        html: icon.html,
        className: "custom-marker",
        iconSize: [icon.iconSize, icon.iconSize],
        iconAnchor: [icon.iconAnchor, icon.iconAnchor],
      });

      const marker = L.marker([attraction.latitude, attraction.longitude], {
        icon: customIcon,
        title: attraction.name,
        zIndexOffset: 0,
        pane: "markerPane",
      }).on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onMarkerClickRef.current(attraction);
      });

      if (meta) {
        (marker as TaggedMarker)._metaTag = meta.tag;
        (marker as TaggedMarker & { _metaColor?: string })._metaColor = meta.color;
      }

      if (clusterGroup) {
        clusterGroup.addLayer(marker);
      } else {
        marker.addTo(map);
      }

      markers.set(attraction.id, marker);
    });

    if (clusterGroup) {
      map.addLayer(clusterGroup);
    }

    return () => {
      markers.forEach((marker) => marker.remove());
      markers.clear();
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current = null;
      }
    };
  }, [mapRef, attractionIdsKey, attractions, enableClustering]);

  // Update all markers when day assignments or selected day change
  useEffect(() => {
    if (!mapRef.current) return;

    if (enableClustering && attractionToDayMap.size === 0 && dayColors.size === 0 && !markerMeta) {
      return;
    }

    const markers = markersRef.current;

    attractions.forEach((attraction) => {
      const marker = markers.get(attraction.id);
      if (!marker) return;

      const attractionDayId = attractionToDayMap.get(attraction.id);
      const isInAnyDay = attractionDayId !== undefined;
      const isInSelectedDay = attractionDayId === selectedDayId;
      const orderNumber = selectedDayAttractionOrders.get(attraction.id);

      const meta = markerMeta?.get(attraction.id);
      let color = meta?.color ?? DEFAULT_COLOR;
      if (isInAnyDay) {
        color = dayColors.get(attractionDayId!) ?? DEFAULT_COLOR;
      }

      const icon = createMarkerIcon(
        color,
        BASE_MARKER_SIZE,
        isInAnyDay,
        false,
        isInSelectedDay ? orderNumber : undefined,
        meta?.isVerified && !isInAnyDay,
      );
      applyMarkerIcon(marker, icon);
    });
  }, [
    attractions,
    attractionToDayMap,
    selectedDayId,
    dayColors,
    selectedDayAttractionOrders,
    mapRef,
    enableClustering,
    markerMeta,
  ]);

  // Update only affected markers when hover/selection changes
  useEffect(() => {
    if (!mapRef.current) return;

    const markers = markersRef.current;
    const affectedIds = new Set<number>();

    if (hoveredAttractionId) affectedIds.add(hoveredAttractionId);
    if (selectedAttractionId) affectedIds.add(selectedAttractionId);
    if (previousHoveredIdRef.current) affectedIds.add(previousHoveredIdRef.current);
    if (previousSelectedIdRef.current) affectedIds.add(previousSelectedIdRef.current);

    affectedIds.forEach((attractionId) => {
      const marker = markers.get(attractionId);
      const attraction = attractionsMap.get(attractionId);
      if (!marker || !attraction) return;

      const attractionDayId = attractionToDayMap.get(attraction.id);
      const isInAnyDay = attractionDayId !== undefined;
      const isInSelectedDay = attractionDayId === selectedDayId;
      const isHovered = hoveredAttractionId === attraction.id;
      const isSelected = selectedAttractionId === attraction.id;
      const orderNumber = selectedDayAttractionOrders.get(attraction.id);

      const meta = markerMeta?.get(attraction.id);
      let color = meta?.color ?? DEFAULT_COLOR;
      if (isInAnyDay) {
        color = dayColors.get(attractionDayId!) ?? DEFAULT_COLOR;
      }

      const size = isSelected ? BASE_MARKER_SIZE + 8 : isHovered ? BASE_MARKER_SIZE + 4 : BASE_MARKER_SIZE;
      const zIndexOffset = isSelected ? 1000 : isHovered ? 500 : 0;

      const icon = createMarkerIcon(
        color,
        size,
        isInAnyDay,
        isHovered || isSelected,
        isInSelectedDay ? orderNumber : undefined,
        meta?.isVerified && !isInAnyDay,
      );
      applyMarkerIcon(marker, icon);
      marker.setZIndexOffset(zIndexOffset);
    });

    previousHoveredIdRef.current = hoveredAttractionId;
    previousSelectedIdRef.current = selectedAttractionId;
  }, [
    hoveredAttractionId,
    selectedAttractionId,
    attractionsMap,
    attractionToDayMap,
    selectedDayId,
    dayColors,
    selectedDayAttractionOrders,
    mapRef,
    markerMeta,
  ]);

  return markersRef;
};
