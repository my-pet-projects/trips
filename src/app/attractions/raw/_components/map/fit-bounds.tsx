"use client";

import L from "leaflet";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

export function FitBounds({
  points,
  countryCode,
}: {
  points: [number, number][];
  countryCode?: string;
}) {
  const map = useMap();
  const fittedForRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (fittedForRef.current !== countryCode && points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 12 });
      fittedForRef.current = countryCode;
    }
  }, [map, points, countryCode]);

  return null;
}
