"use client";

import { useEffect, useRef, type RefObject } from "react";
import type L from "leaflet";

export function useMapClickDeselect(
  mapRef: RefObject<L.Map | null>,
  mapReady: boolean,
  onDeselect: () => void,
) {
  const onDeselectRef = useRef(onDeselect);
  onDeselectRef.current = onDeselect;

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    const handleMapClick = () => onDeselectRef.current();
    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [mapRef, mapReady]);
}
