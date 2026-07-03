"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

export function useMapDeselect(onDeselect: () => void) {
  const map = useMap();
  const onDeselectRef = useRef(onDeselect);
  onDeselectRef.current = onDeselect;

  useEffect(() => {
    const handleMapClick = () => onDeselectRef.current();
    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [map]);
}
