"use client";

import "~/lib/map/leaflet-styles";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";

import { useLeafletMap } from "~/app/_components/map/useLeafletMap";
import { RAW_CLUSTER_PRESET } from "~/lib/map/cluster-presets";
import { createPieClusterIcon } from "~/lib/map/cluster-icon";
import {
  PIN_CLUSTER_SLICE_ORDER,
  PIN_STATUS_COLORS,
  getPinIcon,
  rawIconKey,
} from "~/lib/map/marker-icons/pin";
import { useFitBounds } from "~/lib/map/use-fit-bounds";
import { useMapClickDeselect } from "~/lib/map/use-map-click-deselect";
import { bindMarkerTooltip } from "~/lib/map/marker-tooltip";

import { useRawTriageContext } from "../raw-triage-context";
import type { ExistingMapAttraction, HighlightIconKey, RawMapAttraction } from "../types";
import { toHighlightIconKey } from "../types";

export type PinTaggedMarker = L.Marker & { markerStatus: string };

function syncMarkerTooltip(marker: L.Marker, label: string) {
  const tooltip = marker.getTooltip();
  const current = tooltip?.getContent();
  if (typeof current === "string" && current === label) return;
  bindMarkerTooltip(marker, label);
}

function createRawClusterIcon(cluster: L.MarkerCluster) {
  return createPieClusterIcon(
    cluster,
    (group) => {
      const tally: Record<string, number> = {};
      for (const m of group.getAllChildMarkers()) {
        const status = (m as PinTaggedMarker).markerStatus ?? "none";
        tally[status] = (tally[status] ?? 0) + 1;
      }
      return PIN_CLUSTER_SLICE_ORDER.map((key) => ({
        color: PIN_STATUS_COLORS[key],
        count: tally[key] ?? 0,
      }));
    },
    { innerRadiusRatio: 0.5, dropShadow: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))" },
  );
}

export function RawMapCanvas({ countryCode }: { countryCode?: string }) {
  const {
    allPoints,
    clearSelection,
    rawAttractions,
    existing,
    selection,
    selectRaw,
    selectExisting,
    resolveExistingId,
    promotionMapRef,
  } = useRawTriageContext();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const { mapRef, mapReady } = useLeafletMap(containerRef, [], {
    center: [20, 0],
    zoom: 4,
    attributionControl: false,
  });

  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const clearSelectionRef = useRef(clearSelection);
  clearSelectionRef.current = clearSelection;

  const existingMarkersRef = useRef<Map<number, L.Marker>>(new Map());
  const existingByIdRef = useRef<Map<number, ExistingMapAttraction>>(new Map());
  const rawMarkersRef = useRef<Map<number, L.Marker>>(new Map());
  const rawByIdRef = useRef<Map<number, RawMapAttraction>>(new Map());
  const rawStatusRef = useRef<Map<number, string>>(new Map());

  const onSelectExistingRef = useRef(selectExisting);
  const onSelectRawRef = useRef(selectRaw);
  onSelectExistingRef.current = selectExisting;
  onSelectRawRef.current = selectRaw;

  const existingById = useMemo(() => {
    const map = new Map<number, ExistingMapAttraction>();
    for (const a of existing) map.set(a.id, a);
    return map;
  }, [existing]);

  const rawById = useMemo(() => {
    const map = new Map<number, RawMapAttraction>();
    for (const r of rawAttractions) map.set(r.id, r);
    return map;
  }, [rawAttractions]);

  useFitBounds(mapRef, mapReady, allPoints, countryCode);
  useMapClickDeselect(mapRef, mapReady, clearSelection);

  useLayoutEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      clusterRef.current = null;
      return;
    }

    const cluster = L.markerClusterGroup({
      ...RAW_CLUSTER_PRESET,
      iconCreateFunction: createRawClusterIcon,
    });

    const handleClusterClick = () => clearSelectionRef.current();
    cluster.on("clusterclick", handleClusterClick);
    map.addLayer(cluster);
    clusterRef.current = cluster;

    return () => {
      cluster.off("clusterclick", handleClusterClick);
      map.removeLayer(cluster);
      clusterRef.current = null;
    };
  }, [mapRef, mapReady]);

  useEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;

    existingByIdRef.current = existingById;

    for (const [id, marker] of existingMarkersRef.current) {
      if (existingById.has(id)) continue;

      if (id < 0) {
        const rawId = -id;
        const promotedId = promotionMapRef.current?.get(rawId);
        if (promotedId !== undefined && existingById.has(promotedId)) {
          const item = existingById.get(promotedId)!;
          const key = toHighlightIconKey(item.highlight);
          marker.setIcon(getPinIcon(key));
          (marker as PinTaggedMarker).markerStatus = key;
          promotionMapRef.current?.delete(rawId);
          existingMarkersRef.current.delete(id);
          existingMarkersRef.current.set(promotedId, marker);
          marker.off("click");
          marker.on("click", () => {
            const current = existingByIdRef.current.get(promotedId);
            if (current) onSelectExistingRef.current(current);
          });
          syncMarkerTooltip(marker, item.name);
          continue;
        }
      }

      cluster.removeLayer(marker);
      existingMarkersRef.current.delete(id);
    }

    for (const [id, item] of existingById) {
      if (existingMarkersRef.current.has(id)) {
        const marker = existingMarkersRef.current.get(id)!;
        const key = toHighlightIconKey(item.highlight);
        if ((marker as PinTaggedMarker).markerStatus !== key) {
          marker.setIcon(getPinIcon(key));
          (marker as PinTaggedMarker).markerStatus = key;
        }
        const { lat, lng } = marker.getLatLng();
        if (lat !== item.latitude || lng !== item.longitude) {
          marker.setLatLng([item.latitude, item.longitude]);
        }
        marker.off("click");
        marker.on("click", () => {
          const current = existingByIdRef.current.get(id);
          if (current) onSelectExistingRef.current(current);
        });
        syncMarkerTooltip(marker, item.name);
        continue;
      }

      const key = toHighlightIconKey(item.highlight);
      const marker = L.marker([item.latitude, item.longitude], { icon: getPinIcon(key) });
      (marker as PinTaggedMarker).markerStatus = key;
      marker.on("click", () => {
        const current = existingByIdRef.current.get(id);
        if (current) onSelectExistingRef.current(current);
      });
      syncMarkerTooltip(marker, item.name);
      cluster.addLayer(marker);
      existingMarkersRef.current.set(id, marker);
    }
  }, [existingById, mapReady, promotionMapRef]);

  useEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;

    rawByIdRef.current = rawById;

    for (const [id, marker] of rawMarkersRef.current) {
      if (rawById.has(id)) continue;
      cluster.removeLayer(marker);
      rawMarkersRef.current.delete(id);
      rawStatusRef.current.delete(id);
    }

    for (const [id, item] of rawById) {
      if (rawMarkersRef.current.has(id)) {
        const marker = rawMarkersRef.current.get(id)!;
        const key = rawIconKey(item.status);
        const prevStatus = rawStatusRef.current.get(id);
        if (prevStatus !== item.status) {
          rawStatusRef.current.set(id, item.status);
          (marker as PinTaggedMarker).markerStatus = item.status;
          marker.setIcon(getPinIcon(key));
        }
        const { lat, lng } = marker.getLatLng();
        if (lat !== item.latitude || lng !== item.longitude) {
          marker.setLatLng([item.latitude, item.longitude]);
        }
        marker.off("click");
        marker.on("click", () => {
          const current = rawByIdRef.current.get(id);
          if (current) onSelectRawRef.current(current);
        });
        syncMarkerTooltip(marker, item.name);
        continue;
      }

      const key = rawIconKey(item.status);
      rawStatusRef.current.set(id, item.status);
      const marker = L.marker([item.latitude, item.longitude], { icon: getPinIcon(key) });
      (marker as PinTaggedMarker).markerStatus = item.status;
      marker.on("click", () => {
        const current = rawByIdRef.current.get(id);
        if (current) onSelectRawRef.current(current);
      });
      syncMarkerTooltip(marker, item.name);
      cluster.addLayer(marker);
      rawMarkersRef.current.set(id, marker);
    }
  }, [rawById, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    const clusterGroup = clusterRef.current;
    if (!map || !clusterGroup) return;

    const selectedRawId = selection?.kind === "raw" ? selection.attraction.id : null;
    const selectedExistingId =
      selection?.kind === "existing"
        ? resolveExistingId(selection.attraction.id)
        : null;

    for (const [id, marker] of rawMarkersRef.current) {
      const status = rawStatusRef.current.get(id) ?? "pending";
      const key = rawIconKey(status);
      const isSelected = id === selectedRawId;
      marker.setIcon(getPinIcon(key, isSelected));
      marker.setZIndexOffset(isSelected ? 1000 : 0);
    }

    for (const [id, marker] of existingMarkersRef.current) {
      const key = ((marker as PinTaggedMarker).markerStatus ?? "none") as HighlightIconKey;
      const isSelected = id === selectedExistingId;
      marker.setIcon(getPinIcon(key, isSelected));
      marker.setZIndexOffset(isSelected ? 1000 : 0);
    }

    if (!selection) return;

    let target: L.Marker | undefined;
    if (selection.kind === "raw") {
      target = rawMarkersRef.current.get(selection.attraction.id);
    } else {
      target =
        existingMarkersRef.current.get(selection.attraction.id) ??
        (selectedExistingId !== null
          ? existingMarkersRef.current.get(selectedExistingId)
          : undefined);
    }

    if (!target) return;

    clusterGroup.zoomToShowLayer(target, () => {
      const currentMap = mapRef.current;
      if (!currentMap || currentMap !== map) return;
      if (!clusterGroup.hasLayer(target)) return;
      currentMap.panTo(target.getLatLng(), { animate: true, duration: 0.35 });
    });
  }, [
    mapRef,
    selection,
    mapReady,
    resolveExistingId,
  ]);

  return (
    <div className="relative h-full w-full" data-testid="map-canvas">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
