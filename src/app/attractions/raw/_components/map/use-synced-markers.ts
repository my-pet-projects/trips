"use client";

import type L from "leaflet";
import { useEffect, useRef } from "react";

type UseSyncedMarkersOptions<T> = {
  cluster: L.MarkerClusterGroup | null;
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

export function useSyncedMarkers<T>({
  cluster,
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
  bindClickRef.current = bindClick;
  createMarkerRef.current = createMarker;
  tryRekeyRef.current = tryRekey;

  useEffect(() => {
    if (!cluster) return;

    dataRef.current = items;

    for (const [id, marker] of markersRef.current) {
      if (items.has(id)) continue;

      const rekeyed = tryRekeyRef.current?.(id, marker, items);
      if (rekeyed) {
        markersRef.current.delete(id);
        markersRef.current.set(rekeyed.newId, marker);
        bindClickRef.current(marker, rekeyed.newId);
        continue;
      }

      cluster.removeLayer(marker);
      markersRef.current.delete(id);
    }

    for (const [id, item] of items) {
      if (markersRef.current.has(id)) {
        bindClickRef.current(markersRef.current.get(id)!, id);
        continue;
      }

      const marker = createMarkerRef.current(item);
      bindClickRef.current(marker, id);
      cluster.addLayer(marker);
      markersRef.current.set(id, marker);
    }
  }, [cluster, items, markersRef, dataRef]);
}
