import L from "leaflet";
import { useEffect, useRef } from "react";

import type { AttractionSummary, BasicAttraction } from "~/types";

export const useMapCenteringAndBounds = (
  mapRef: React.RefObject<L.Map | null>,
  hasInitializedBounds: React.RefObject<boolean>,
  attractions: AttractionSummary[],
  attractionsMap: Map<number, AttractionSummary>,
  selectedDayAttractions: BasicAttraction[],
  selectedDayId: number | null,
  selectedAttractionId: number | null,
  panelHeight: number,
  userLocation: [number, number] | null,
) => {
  // Track whether we've already centered for the current selection
  const lastCenteredIdRef = useRef<number | null>(null);
  const panelHeightRef = useRef(panelHeight);
  panelHeightRef.current = panelHeight;

  // Center map on selected attraction - only when selection changes
  useEffect(() => {
    if (!mapRef.current || !selectedAttractionId) {
      lastCenteredIdRef.current = null;
      return;
    }

    // Skip if we already centered for this selection
    if (lastCenteredIdRef.current === selectedAttractionId) {
      return;
    }

    const attraction = attractionsMap.get(selectedAttractionId);
    if (!attraction?.latitude || !attraction?.longitude) return;

    const map = mapRef.current;
    lastCenteredIdRef.current = selectedAttractionId;

    const timeoutId = setTimeout(() => {
      const offset =
        panelHeightRef.current > 0 ? panelHeightRef.current / 2 : 0;
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
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [selectedAttractionId, attractionsMap, mapRef]);

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
