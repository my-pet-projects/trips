"use client";

import L from "leaflet";
import { useEffect, useRef, type RefObject } from "react";

export function useFitBounds(
  mapRef: RefObject<L.Map | null>,
  mapReady: boolean,
  points: [number, number][],
  triggerKey?: string,
  options?: { padding?: [number, number]; maxZoom?: number },
) {
  const fittedForRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || points.length === 0) return;
    if (fittedForRef.current === triggerKey) return;

    map.fitBounds(L.latLngBounds(points), {
      padding: options?.padding ?? [40, 40],
      maxZoom: options?.maxZoom ?? 12,
    });
    fittedForRef.current = triggerKey;
  }, [mapRef, mapReady, points, triggerKey, options?.padding, options?.maxZoom]);
}
