import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

import type { RouterOutputs } from "~/trpc/react";

type Attraction =
  RouterOutputs["attraction"]["getAttractionsByCountries"][number];

const getInitialMapCenter = (attractions: Attraction[]): [number, number] => {
  const validAttractions = attractions.filter((a) => a.latitude && a.longitude);

  if (validAttractions.length === 0) {
    return [48.8566, 2.3522]; // Fallback to Paris
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
  attractions: Attraction[],
) => {
  const mapRef = useRef<L.Map | null>(null);
  const initialAttractionsRef = useRef(attractions);
  const hasInitializedBounds = useRef(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center = getInitialMapCenter(initialAttractionsRef.current);
    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView(center, 5);
    map.attributionControl.setPrefix("");

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      minZoom: 3,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      hasInitializedBounds.current = false;
    };
  }, [containerRef]);

  return { mapRef, hasInitializedBounds };
};
