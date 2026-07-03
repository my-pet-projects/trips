"use client";

import type L from "leaflet";
import { useEffect, useRef } from "react";

export type UseSyncedMarkersOptions<T> = {
  cluster?: L.MarkerClusterGroup | null;
  clusterRef?: React.RefObject<L.MarkerClusterGroup | null>;
  clusterGen?: number;
  mapRef?: React.RefObject<L.Map | null>;
  mapReady?: boolean;
  items: Map<number, T>;
  markersRef: React.MutableRefObject<Map<number, L.Marker>>;
  dataRef: React.MutableRefObject<Map<number, T>>;
  bindClick: (marker: L.Marker, id: number) => void;
  createMarker: (item: T) => L.Marker;
  tryRekey?: (
    id: number,
    marker: L.Marker,
    items: Map<number, T>,
  ) => { newId: number; item: T } | null;
};

function attachMarker(
  marker: L.Marker,
  clusterGroup: L.MarkerClusterGroup | null,
  directMap: L.Map | null,
) {
  if (clusterGroup) {
    if (!clusterGroup.hasLayer(marker)) {
      clusterGroup.addLayer(marker);
    }
    return;
  }

  if (directMap && !directMap.hasLayer(marker)) {
    marker.addTo(directMap);
  }
}

export function useSyncedMarkers<T>({
  cluster,
  clusterRef,
  clusterGen,
  mapRef,
  mapReady = true,
  items,
  markersRef,
  dataRef,
  bindClick,
  createMarker,
  tryRekey,
}: UseSyncedMarkersOptions<T>) {
  const bindClickRef = useRef(bindClick);
  const createMarkerRef = useRef(createMarker);
  const tryRekeyRef = useRef(tryRekey);
  const layerRef = useRef<L.MarkerClusterGroup | L.Map | null>(null);
  bindClickRef.current = bindClick;
  createMarkerRef.current = createMarker;
  tryRekeyRef.current = tryRekey;

  useEffect(() => {
    const clusterGroup = cluster ?? clusterRef?.current ?? null;
    const directMap = !clusterGroup && mapReady ? mapRef?.current ?? null : null;
    const layer = clusterGroup ?? directMap;
    if (!layer) return;

    const layerChanged = layerRef.current !== layer;
    layerRef.current = layer;

    dataRef.current = items;

    for (const [id, marker] of markersRef.current) {
      if (items.has(id)) continue;

      const rekeyed = tryRekeyRef.current?.(id, marker, items);
      if (rekeyed) {
        markersRef.current.delete(id);
        markersRef.current.set(rekeyed.newId, marker);
        bindClickRef.current(marker, rekeyed.newId);
        attachMarker(marker, clusterGroup, directMap);
        continue;
      }

      if (clusterGroup) {
        clusterGroup.removeLayer(marker);
      } else {
        marker.remove();
      }
      markersRef.current.delete(id);
    }

    for (const [id, item] of items) {
      if (markersRef.current.has(id)) {
        const marker = markersRef.current.get(id)!;
        bindClickRef.current(marker, id);
        if (layerChanged) {
          attachMarker(marker, clusterGroup, directMap);
        }
        continue;
      }

      const marker = createMarkerRef.current(item);
      bindClickRef.current(marker, id);
      attachMarker(marker, clusterGroup, directMap);
      markersRef.current.set(id, marker);
    }
  }, [cluster, clusterRef, clusterGen, mapRef, mapReady, items, markersRef, dataRef]);
}
