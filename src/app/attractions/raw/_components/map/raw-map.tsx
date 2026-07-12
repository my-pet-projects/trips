"use client";

import "~/lib/map/leaflet-styles";
import L from "leaflet";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { LeafletMapCanvas } from "~/app/_components/map/leaflet-map-core";
import { useLeafletMap } from "~/app/_components/map/use-leaflet-map";
import { MARKER_STATUS_COLORS } from "~/lib/map/colors";
import { circleMarkerDivIcon } from "~/lib/map/marker-icons/circle";
import { useFitBounds } from "~/lib/map/use-fit-bounds";
import { useMapClickDeselect } from "~/lib/map/use-map-click-deselect";
import { useMarkerClusterGroup } from "~/lib/map/use-marker-cluster-group";
import { useMarkerLayer } from "~/lib/map/use-marker-layer";

import type { RawMapData } from "../hooks/use-raw-triage";
import type { ExistingMapAttraction, RawMapAttraction } from "../types";
import { toHighlightIconKey, toRawStatusKey } from "../types";

export type RawMapProps = { countryCode?: string; map: RawMapData };

export function RawMap({ countryCode, map }: RawMapProps) {
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
  } = map;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { mapRef, mapReady } = useLeafletMap(containerRef, [], {
    center: [20, 0],
    zoom: 4,
    attributionControl: false,
  });

  const existingById = useMemo(() => {
    const byId = new Map<number, ExistingMapAttraction>();
    for (const a of existing) byId.set(a.id, a);
    return byId;
  }, [existing]);

  const rawById = useMemo(() => {
    const byId = new Map<number, RawMapAttraction>();
    for (const r of rawAttractions) byId.set(r.id, r);
    return byId;
  }, [rawAttractions]);

  useFitBounds(mapRef, mapReady, allPoints, countryCode);
  useMapClickDeselect(mapRef, mapReady, clearSelection);

  const { clusterRef, clusterGen } = useMarkerClusterGroup(
    mapRef,
    true,
    mapReady,
    clearSelection,
  );

  // A raw attraction that gets approved is optimistically added to `existing`
  // under a temporary id of `-rawId`; re-key its marker to the real id instead
  // of destroying and recreating it.
  const tryRekeyExisting = useCallback(
    (
      id: number,
      _marker: L.Marker,
      items: Map<number, ExistingMapAttraction>,
    ) => {
      if (id >= 0) return null;
      const rawId = -id;
      const promotedId = promotionMapRef.current?.get(rawId);
      if (promotedId === undefined) return null;
      const item = items.get(promotedId);
      if (!item) return null;
      promotionMapRef.current?.delete(rawId);
      return { newId: promotedId, item };
    },
    [promotionMapRef],
  );

  const selectedExistingId =
    selection?.kind === "existing"
      ? resolveExistingId(selection.attraction.id)
      : null;

  const getExistingVisual = useCallback(
    (a: ExistingMapAttraction) => {
      const key = toHighlightIconKey(a.highlight);
      const color = MARKER_STATUS_COLORS[key];
      const isSelected = a.id === selectedExistingId;
      return {
        icon: circleMarkerDivIcon({ color, isHighlighted: isSelected }),
        zIndexOffset: isSelected ? 1000 : 0,
        tag: { key, color },
      };
    },
    [selectedExistingId],
  );

  const getRawVisual = useCallback(
    (r: RawMapAttraction) => {
      const key = toRawStatusKey(r.status);
      const color = MARKER_STATUS_COLORS[key];
      const isSelected =
        selection?.kind === "raw" && selection.attraction.id === r.id;
      return {
        icon: circleMarkerDivIcon({ color, isHighlighted: isSelected }),
        zIndexOffset: isSelected ? 1000 : 0,
        tag: { key, color },
      };
    },
    [selection],
  );

  const existingMarkersRef = useMarkerLayer<ExistingMapAttraction>({
    clusterRef,
    clusterGen,
    mapReady,
    items: existingById,
    getLatLng: (a) => [a.latitude, a.longitude],
    getLabel: (a) => a.name,
    getVisual: getExistingVisual,
    onSelect: selectExisting,
    tryRekey: tryRekeyExisting,
  });

  const rawMarkersRef = useMarkerLayer<RawMapAttraction>({
    clusterRef,
    clusterGen,
    mapReady,
    items: rawById,
    getLatLng: (r) => [r.latitude, r.longitude],
    getLabel: (r) => r.name,
    getVisual: getRawVisual,
    onSelect: selectRaw,
  });

  // Reveal the selected marker (spiderfy/zoom + pan). Icon highlighting is
  // handled by each layer's `getVisual`.
  useEffect(() => {
    const leafletMap = mapRef.current;
    const clusterGroup = clusterRef.current;
    if (!leafletMap || !clusterGroup || !selection) return;

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
      if (!currentMap || currentMap !== leafletMap) return;
      if (!clusterGroup.hasLayer(target)) return;
      currentMap.panTo(target.getLatLng(), { animate: true, duration: 0.35 });
    });
  }, [
    mapRef,
    clusterRef,
    selection,
    clusterGen,
    selectedExistingId,
    existingMarkersRef,
    rawMarkersRef,
  ]);

  return <LeafletMapCanvas containerRef={containerRef} />;
}
