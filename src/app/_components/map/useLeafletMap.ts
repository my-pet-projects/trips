import L from "leaflet";
import { useLayoutEffect, useRef, useState } from "react";

import type { AttractionSummary } from "~/types";

export type LeafletMapViewOptions = {
  center?: [number, number];
  zoom?: number;
  attributionControl?: boolean;
};

const getInitialMapCenter = (attractions: AttractionSummary[]): [number, number] => {
  const validAttractions = attractions.filter(
    (a) => a.latitude != null && a.longitude != null,
  );

  if (validAttractions.length === 0) {
    return [48.8566, 2.3522];
  }

  const avgLat =
    validAttractions.reduce((sum, a) => sum + a.latitude!, 0) /
    validAttractions.length;
  const avgLng =
    validAttractions.reduce((sum, a) => sum + a.longitude!, 0) /
    validAttractions.length;

  return [avgLat, avgLng];
};

export const useLeafletMap = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  attractions: AttractionSummary[],
  viewOptions?: LeafletMapViewOptions,
) => {
  const mapRef = useRef<L.Map | null>(null);
  const initialAttractionsRef = useRef(attractions);
  const viewOptionsRef = useRef(viewOptions);
  viewOptionsRef.current = viewOptions;
  const hasInitializedBounds = useRef<boolean>(false);
  const [mapReady, setMapReady] = useState(false);

  useLayoutEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center =
      viewOptionsRef.current?.center ?? getInitialMapCenter(initialAttractionsRef.current);
    const zoom = viewOptionsRef.current?.zoom ?? 5;
    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: viewOptionsRef.current?.attributionControl ?? true,
    }).setView(center, zoom);
    map.attributionControl?.setPrefix("");

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      minZoom: 3,
    }).addTo(map);

    mapRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      hasInitializedBounds.current = false;
      setMapReady(false);
    };
  }, [containerRef]);

  return { mapRef, hasInitializedBounds, mapReady };
};
