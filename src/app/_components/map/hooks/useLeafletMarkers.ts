import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { useEffect, useRef } from "react";

import type { AttractionSummary } from "~/types";

export type MarkerMeta = { color: string; tag: string };

type TaggedMarker = L.Marker & { _metaTag?: string };

const BASE_MARKER_SIZE = 26;
const DEFAULT_COLOR = "#9ca3af";

const createMarkerIcon = (
  color: string,
  size: number,
  isInDay: boolean,
  isHighlighted: boolean,
  orderNumber?: number,
) => {
  return `
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
    </div>
  `;
};

function buildPiePaths(
  slices: { color: string; count: number }[],
  cx: number,
  cy: number,
  r: number,
): string {
  const total = slices.reduce((s, sl) => s + sl.count, 0);
  if (total === 0) return "";
  const nonEmpty = slices.filter((sl) => sl.count > 0);
  if (nonEmpty.length === 1) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${nonEmpty[0]!.color}"/>`;
  }
  let paths = "";
  let angle = -Math.PI / 2;
  for (const sl of nonEmpty) {
    const sweep = (sl.count / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    paths += `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${sweep > Math.PI ? 1 : 0},1 ${x2},${y2} Z" fill="${sl.color}"/>`;
  }
  return paths;
}

function createClusterIconWithMeta(
  markerMetaRef: React.RefObject<Map<number, MarkerMeta> | undefined>,
): (cluster: L.MarkerCluster) => L.DivIcon {
  return (cluster) => {
    const count = cluster.getChildCount();
    const size = count >= 100 ? 50 : count >= 10 ? 45 : 38;
    const r = size / 2;
    const pieR = r - 3;
    const innerR = Math.round(pieR * 0.55);
    const fontSize = count >= 100 ? 13 : 12;

    const meta = markerMetaRef.current;
    let pie = "";

    if (meta && meta.size > 0) {
      const tally = new Map<string, { color: string; count: number }>();
      for (const m of cluster.getAllChildMarkers()) {
        const tag = (m as TaggedMarker)._metaTag ?? "default";
        const color = (m as TaggedMarker & { _metaColor?: string })._metaColor ?? DEFAULT_COLOR;
        const entry = tally.get(tag);
        if (entry) entry.count++;
        else tally.set(tag, { color, count: 1 });
      }
      const slices = [...tally.values()];
      pie = buildPiePaths(slices, r, r, pieR);
    } else {
      pie = `<circle cx="${r}" cy="${r}" r="${pieR}" fill="#0ea5e9"/>`;
    }

    const html = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" style="filter:drop-shadow(0 2px 6px rgba(0,0,0,0.3))">
      <circle cx="${r}" cy="${r}" r="${r}" fill="white"/>
      ${pie}
      <circle cx="${r}" cy="${r}" r="${innerR}" fill="white"/>
      <text x="${r}" y="${r}" text-anchor="middle" dominant-baseline="central" fill="#1f2937" font-weight="700" font-size="${fontSize}" font-family="system-ui,sans-serif">${count}</text>
    </svg>`;

    return L.divIcon({
      html,
      className: "marker-cluster",
      iconSize: L.point(size, size),
      iconAnchor: L.point(r, r),
    });
  };
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
  const previousAttractionIdsRef = useRef<Set<number>>(new Set());

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

  // Create/recreate markers only when the attraction set changes.
  useEffect(() => {
    if (!mapRef.current) return;

    const currentIds = new Set(attractions.map((a) => a.id));
    const prevIds = previousAttractionIdsRef.current;

    if (
      currentIds.size === prevIds.size &&
      attractions.every((a) => prevIds.has(a.id)) &&
      markersRef.current.size > 0
    ) {
      return;
    }

    previousAttractionIdsRef.current = currentIds;

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

      let color = markerMetaRef.current?.get(attraction.id)?.color ?? DEFAULT_COLOR;
      if (isInAnyDay) {
        color = dayColorsRef.current.get(attractionDayId!) ?? DEFAULT_COLOR;
      }

      const iconHtml = createMarkerIcon(color, BASE_MARKER_SIZE, isInAnyDay, false, isInSelectedDay ? orderNumber : undefined);
      const customIcon = L.divIcon({
        html: iconHtml,
        className: "custom-marker",
        iconSize: [BASE_MARKER_SIZE, BASE_MARKER_SIZE],
        iconAnchor: [BASE_MARKER_SIZE / 2, BASE_MARKER_SIZE / 2],
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

      const meta = markerMetaRef.current?.get(attraction.id);
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
  }, [mapRef, attractions, enableClustering]);

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

      let color = markerMeta?.get(attraction.id)?.color ?? DEFAULT_COLOR;
      if (isInAnyDay) {
        color = dayColors.get(attractionDayId!) ?? DEFAULT_COLOR;
      }

      const iconHtml = createMarkerIcon(color, BASE_MARKER_SIZE, isInAnyDay, false, isInSelectedDay ? orderNumber : undefined);
      marker.setIcon(L.divIcon({
        html: iconHtml,
        className: "custom-marker",
        iconSize: [BASE_MARKER_SIZE, BASE_MARKER_SIZE],
        iconAnchor: [BASE_MARKER_SIZE / 2, BASE_MARKER_SIZE / 2],
      }));
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

      let color = markerMeta?.get(attraction.id)?.color ?? DEFAULT_COLOR;
      if (isInAnyDay) {
        color = dayColors.get(attractionDayId!) ?? DEFAULT_COLOR;
      }

      const size = isSelected ? BASE_MARKER_SIZE + 8 : isHovered ? BASE_MARKER_SIZE + 4 : BASE_MARKER_SIZE;
      const zIndexOffset = isSelected ? 1000 : isHovered ? 500 : 0;

      const iconHtml = createMarkerIcon(color, size, isInAnyDay, isHovered || isSelected, isInSelectedDay ? orderNumber : undefined);
      marker.setIcon(L.divIcon({
        html: iconHtml,
        className: "custom-marker",
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      }));
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
