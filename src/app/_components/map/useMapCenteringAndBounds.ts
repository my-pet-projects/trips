import L from "leaflet";
import { useEffect, useRef } from "react";

import type { AttractionSummary, BasicAttraction } from "~/types";

export type MapCenteringAndBoundsOptions = {
  mapRef: React.RefObject<L.Map | null>;
  hasInitializedBounds: React.RefObject<boolean>;
  attractions: AttractionSummary[];
  attractionsMap: Map<number, AttractionSummary>;
  selectedDayAttractions?: BasicAttraction[];
  selectedDayId?: number | null;
  selectedAttractionId?: number | null;
  panelHeight?: number;
  userLocation?: [number, number] | null;
};

export const useMapCenteringAndBounds = ({
  mapRef,
  hasInitializedBounds,
  attractions,
  attractionsMap,
  selectedDayAttractions = [],
  selectedDayId = null,
  selectedAttractionId = null,
  panelHeight = 0,
  userLocation = null,
}: MapCenteringAndBoundsOptions) => {
  const lastCenteredRef = useRef<{
    id: number;
    panelHeight: number;
  } | null>(null);

  // Center map on selected attraction, offset for the detail panel
  useEffect(() => {
    if (!mapRef.current || !selectedAttractionId) {
      lastCenteredRef.current = null;
      return;
    }

    const attraction = attractionsMap.get(selectedAttractionId);
    if (!attraction?.latitude || !attraction?.longitude) return;

    // Wait until the detail panel reports its height (50% of map)
    if (panelHeight === 0) {
      return;
    }

    const last = lastCenteredRef.current;
    if (
      last?.id === selectedAttractionId &&
      Math.abs(last.panelHeight - panelHeight) < 4
    ) {
      return;
    }

    const map = mapRef.current;

    const timeoutId = setTimeout(() => {
      map.invalidateSize();

      const offset = panelHeight / 2;
      const targetLatLng = L.latLng(
        attraction.latitude!,
        attraction.longitude!,
      );
      const zoom = map.getZoom() < 15 ? 15 : map.getZoom();
      const targetPoint = map.project(targetLatLng, zoom);
      const offsetPoint = L.point(targetPoint.x, targetPoint.y + offset);
      const offsetLatLng = map.unproject(offsetPoint, zoom);

      map.setView(offsetLatLng, zoom, {
        animate: true,
        duration: 0.5,
      });

      lastCenteredRef.current = {
        id: selectedAttractionId,
        panelHeight,
      };
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [selectedAttractionId, attractionsMap, mapRef, panelHeight]);

  // Center map on selected day attractions
  useEffect(() => {
    if (!mapRef.current || !selectedDayId || selectedAttractionId) return;

    const map = mapRef.current;
    const validAttractions = selectedDayAttractions.filter(
      (a) => a.latitude && a.longitude,
    );

    if (validAttractions.length === 0) return;

    // Timeout to ensure markers are rendered
    const timeoutId = setTimeout(() => {
      if (validAttractions.length === 1) {
        const attraction = validAttractions[0]!;
        map.setView([attraction.latitude!, attraction.longitude!], 14, {
          animate: true,
          duration: 0.5,
        });
      } else {
        const bounds = L.latLngBounds(
          validAttractions.map((a) => [a.latitude!, a.longitude!]),
        );

        if (userLocation) {
          bounds.extend(userLocation);
        }

        map.fitBounds(bounds, {
          padding: [60, 60],
          maxZoom: 15,
          animate: true,
          duration: 0.5,
        });
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [
    selectedDayId,
    selectedDayAttractions,
    selectedAttractionId,
    userLocation,
    mapRef,
  ]);

  // Initial fit bounds for all attractions (if no day/attraction selected)
  useEffect(() => {
    if (
      !mapRef.current ||
      hasInitializedBounds.current ||
      selectedDayId ||
      selectedAttractionId
    )
      return;

    const map = mapRef.current;
    const validAttractions = attractions.filter(
      (a) => a.latitude && a.longitude,
    );

    if (validAttractions.length === 0) return;

    const bounds = L.latLngBounds(
      validAttractions.map((a) => [a.latitude!, a.longitude!]),
    );

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 12,
      });
      hasInitializedBounds.current = true;
    }
  }, [
    mapRef,
    attractions,
    selectedDayId,
    selectedAttractionId,
    hasInitializedBounds,
  ]);
};
