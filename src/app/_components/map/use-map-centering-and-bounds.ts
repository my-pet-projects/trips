import L from "leaflet";
import { useEffect, useRef } from "react";

import { fitMapToPoints } from "~/lib/map/use-fit-bounds";
import type { AttractionSummary, BasicAttraction } from "~/types";

export type MapCenteringAndBoundsOptions = {
  mapRef: React.RefObject<L.Map | null>;
  hasInitializedBounds: React.RefObject<boolean>;
  attractions: AttractionSummary[];
  attractionsMap: Map<number, AttractionSummary>;
  selectedBlockAttractions?: BasicAttraction[];
  selectedBlockId?: number | null;
  selectedAttractionId?: number | null;
  panelHeight?: number;
  userLocation?: [number, number] | null;
};

/** Delay before recentring on a selection, so the detail panel can settle. */
const PANEL_SETTLE_DELAY_MS = 150;
/** Delay before fitting a block's bounds, so its markers have rendered. */
const MARKER_RENDER_DELAY_MS = 50;
/** Ignore panel-height jitter smaller than this (px) to avoid re-centering. */
const PANEL_HEIGHT_EPSILON = 4;

const SELECTED_ATTRACTION_MIN_ZOOM = 15;
const SINGLE_ATTRACTION_ZOOM = 14;
const BLOCK_FIT_PADDING: [number, number] = [60, 60];
const BLOCK_FIT_MAX_ZOOM = 15;
const INITIAL_FIT_PADDING: [number, number] = [50, 50];
const INITIAL_FIT_MAX_ZOOM = 12;
const CENTER_ANIMATION: L.ZoomPanOptions = { animate: true, duration: 0.5 };

/**
 * Recentre `map` on a point while keeping it visible above the detail panel,
 * which covers the bottom `panelHeight` pixels of the map.
 */
function centerWithPanelOffset(
  map: L.Map,
  latitude: number,
  longitude: number,
  panelHeight: number,
) {
  map.invalidateSize();

  const zoom = Math.max(map.getZoom(), SELECTED_ATTRACTION_MIN_ZOOM);
  const targetPoint = map.project(L.latLng(latitude, longitude), zoom);
  const offsetPoint = L.point(targetPoint.x, targetPoint.y + panelHeight / 2);
  const offsetLatLng = map.unproject(offsetPoint, zoom);

  map.setView(offsetLatLng, zoom, CENTER_ANIMATION);
}

export const useMapCenteringAndBounds = ({
  mapRef,
  hasInitializedBounds,
  attractions,
  attractionsMap,
  selectedBlockAttractions = [],
  selectedBlockId = null,
  selectedAttractionId = null,
  panelHeight = 0,
  userLocation = null,
}: MapCenteringAndBoundsOptions) => {
  const lastCenteredRef = useRef<{
    id: number;
    panelHeight: number;
  } | null>(null);

  // Center map on selected attraction, offset for the detail panel.
  useEffect(() => {
    if (!mapRef.current || !selectedAttractionId) {
      lastCenteredRef.current = null;
      return;
    }

    const attraction = attractionsMap.get(selectedAttractionId);
    if (!attraction?.latitude || !attraction?.longitude) return;

    // Wait until the detail panel reports its height (50% of map).
    if (panelHeight === 0) return;

    const last = lastCenteredRef.current;
    if (
      last?.id === selectedAttractionId &&
      Math.abs(last.panelHeight - panelHeight) < PANEL_HEIGHT_EPSILON
    ) {
      return;
    }

    const map = mapRef.current;

    const timeoutId = setTimeout(() => {
      centerWithPanelOffset(
        map,
        attraction.latitude!,
        attraction.longitude!,
        panelHeight,
      );
      lastCenteredRef.current = { id: selectedAttractionId, panelHeight };
    }, PANEL_SETTLE_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, [selectedAttractionId, attractionsMap, mapRef, panelHeight]);

  // Center map on the selected block's attractions.
  useEffect(() => {
    if (!mapRef.current || !selectedBlockId || selectedAttractionId) return;

    const map = mapRef.current;
    const validAttractions = selectedBlockAttractions.filter(
      (a) => a.latitude && a.longitude,
    );

    if (validAttractions.length === 0) return;

    const timeoutId = setTimeout(() => {
      if (validAttractions.length === 1) {
        const attraction = validAttractions[0]!;
        map.setView(
          [attraction.latitude!, attraction.longitude!],
          SINGLE_ATTRACTION_ZOOM,
          CENTER_ANIMATION,
        );
        return;
      }

      const bounds = L.latLngBounds(
        validAttractions.map((a) => [a.latitude!, a.longitude!]),
      );
      if (userLocation) bounds.extend(userLocation);

      map.fitBounds(bounds, {
        padding: BLOCK_FIT_PADDING,
        maxZoom: BLOCK_FIT_MAX_ZOOM,
        ...CENTER_ANIMATION,
      });
    }, MARKER_RENDER_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, [
    selectedBlockId,
    selectedBlockAttractions,
    selectedAttractionId,
    userLocation,
    mapRef,
  ]);

  // Initial fit bounds for all attractions (if no block/attraction selected).
  useEffect(() => {
    if (
      !mapRef.current ||
      hasInitializedBounds.current ||
      selectedBlockId ||
      selectedAttractionId
    )
      return;

    const points = attractions
      .filter((a) => a.latitude && a.longitude)
      .map((a) => [a.latitude!, a.longitude!] as [number, number]);

    const fitted = fitMapToPoints(mapRef.current, points, {
      padding: INITIAL_FIT_PADDING,
      maxZoom: INITIAL_FIT_MAX_ZOOM,
    });
    if (fitted) {
      hasInitializedBounds.current = true;
    }
  }, [
    mapRef,
    attractions,
    selectedBlockId,
    selectedAttractionId,
    hasInitializedBounds,
  ]);
};
