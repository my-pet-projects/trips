"use client";

import L from "leaflet";
import { useEffect, useRef, type RefObject } from "react";

export type FitBoundsOptions = {
  padding?: [number, number];
  maxZoom?: number;
};

/**
 * Fit `map` to the given points. Returns `false` (without touching the map) when
 * there are no valid points, so callers can guard follow-up state.
 */
export function fitMapToPoints(
  map: L.Map,
  points: [number, number][],
  options?: FitBoundsOptions,
): boolean {
  if (points.length === 0) return false;
  const bounds = L.latLngBounds(points);
  if (!bounds.isValid()) return false;

  map.fitBounds(bounds, {
    padding: options?.padding ?? [40, 40],
    maxZoom: options?.maxZoom ?? 12,
  });
  return true;
}

export function useFitBounds(
  mapRef: RefObject<L.Map | null>,
  mapReady: boolean,
  points: [number, number][],
  triggerKey?: string,
  options?: FitBoundsOptions,
) {
  const fittedForRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || fittedForRef.current === triggerKey) return;

    if (fitMapToPoints(map, points, options)) {
      fittedForRef.current = triggerKey;
    }
  }, [mapRef, mapReady, points, triggerKey, options?.padding, options?.maxZoom]);
}
