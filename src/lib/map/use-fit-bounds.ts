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

/** Sentinel for "never fitted" — distinct from any `triggerKey` value,
 * including `undefined`, so the first fit always runs. */
const NEVER_FITTED = Symbol("never-fitted");

export function useFitBounds(
  mapRef: RefObject<L.Map | null>,
  mapReady: boolean,
  points: [number, number][],
  triggerKey?: string,
  options?: FitBoundsOptions,
) {
  const fittedForRef = useRef<string | undefined | typeof NEVER_FITTED>(
    NEVER_FITTED,
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || fittedForRef.current === triggerKey) return;

    if (fitMapToPoints(map, points, options)) {
      fittedForRef.current = triggerKey;
    }
  }, [mapRef, mapReady, points, triggerKey, options?.padding, options?.maxZoom]);
}
