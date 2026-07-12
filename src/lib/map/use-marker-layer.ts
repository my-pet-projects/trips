"use client";

import L from "leaflet";
import { useCallback, useEffect, useRef, type RefObject } from "react";

import { type CircleTaggedMarker } from "~/lib/map/marker-icons/circle";
import {
  bindMarkerTooltip,
  getMarkerTooltipText,
} from "~/lib/map/marker-tooltip";

function attachMarker(
  marker: L.Marker,
  clusterGroup: L.MarkerClusterGroup | null,
  directMap: L.Map | null,
) {
  if (clusterGroup) {
    if (!clusterGroup.hasLayer(marker)) clusterGroup.addLayer(marker);
    return;
  }
  if (directMap && !directMap.hasLayer(marker)) marker.addTo(directMap);
}

function syncTooltip(marker: L.Marker, label: string) {
  const trimmed = label.trim();
  if (getMarkerTooltipText(marker.getTooltip()?.getContent()) === trimmed) return;
  bindMarkerTooltip(marker, label);
}

/** How a single marker should look right now. Returned by `getVisual`. */
export type MarkerVisual = {
  icon: L.DivIcon;
  zIndexOffset?: number;
  /** Cluster-pie tag; `null`/omitted excludes the marker from pies. */
  tag?: { key: string; color: string } | null;
};

export type MarkerLayerOptions<T> = {
  /** Render into a cluster group, or set `mapRef` for un-clustered markers. */
  clusterRef?: RefObject<L.MarkerClusterGroup | null>;
  clusterGen?: number;
  mapRef?: RefObject<L.Map | null>;
  mapReady?: boolean;
  items: Map<number, T>;
  getLatLng: (item: T) => [number, number];
  getLabel?: (item: T) => string;
  /**
   * Full visual description for an item (icon, z-index, cluster tag). Memoize
   * this with `useCallback` — every marker is restyled whenever its identity
   * changes, so its dependency list is what drives interaction restyles
   * (selection, hover, block colors, …).
   */
  getVisual: (item: T) => MarkerVisual;
  onSelect: (item: T) => void;
  /** Stop the marker click from reaching the map (e.g. to avoid deselect). */
  stopClickPropagation?: boolean;
  tryRekey?: (
    id: number,
    marker: L.Marker,
    items: Map<number, T>,
  ) => { newId: number; item: T } | null;
};

/**
 * The single data-driven Leaflet marker layer. Diffs a `Map<id, item>` against
 * the live markers (create / remove / re-key), attaches them to a cluster group
 * or the map directly, binds a selection click, and (re)applies the caller's
 * `getVisual` on create and whenever `restyleDeps` change. Callers decide how a
 * marker looks — a plain colored circle or a rich descriptor circle — while all
 * the plumbing stays here.
 */
export function useMarkerLayer<T>({
  clusterRef,
  clusterGen,
  mapRef,
  mapReady = true,
  items,
  getLatLng,
  getLabel,
  getVisual,
  onSelect,
  stopClickPropagation = false,
  tryRekey,
}: MarkerLayerOptions<T>): RefObject<Map<number, L.Marker>> {
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const dataRef = useRef<Map<number, T>>(new Map());
  const layerRef = useRef<L.MarkerClusterGroup | L.Map | null>(null);

  const getLatLngRef = useRef(getLatLng);
  getLatLngRef.current = getLatLng;
  const getLabelRef = useRef(getLabel);
  getLabelRef.current = getLabel;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const tryRekeyRef = useRef(tryRekey);
  tryRekeyRef.current = tryRekey;

  // Recreated when `getVisual` changes, which is what triggers the restyle
  // pass below. The diff effect calls it through a ref so it never re-runs.
  const applyVisual = useCallback(
    (marker: L.Marker, item: T) => {
      const visual = getVisual(item);
      marker.setIcon(visual.icon);
      marker.setZIndexOffset(visual.zIndexOffset ?? 0);

      const tagged = marker as CircleTaggedMarker;
      if (visual.tag) {
        tagged._metaTag = visual.tag.key;
        tagged._metaColor = visual.tag.color;
      } else {
        delete tagged._metaTag;
        delete tagged._metaColor;
      }

      const label = getLabelRef.current?.(item);
      if (label !== undefined) syncTooltip(marker, label);

      const [lat, lng] = getLatLngRef.current(item);
      const current = marker.getLatLng();
      if (current.lat !== lat || current.lng !== lng) {
        marker.setLatLng([lat, lng]);
      }
    },
    [getVisual],
  );
  const applyVisualRef = useRef(applyVisual);
  applyVisualRef.current = applyVisual;

  const bindClick = useCallback(
    (marker: L.Marker, id: number) => {
      marker.off("click");
      marker.on("click", (e) => {
        if (stopClickPropagation) L.DomEvent.stopPropagation(e);
        const current = dataRef.current.get(id);
        if (current) onSelectRef.current(current);
      });
    },
    [stopClickPropagation],
  );

  useEffect(() => {
    const clusterGroup = clusterRef?.current ?? null;
    const directMap = !clusterGroup && mapReady ? mapRef?.current ?? null : null;
    const layer = clusterGroup ?? directMap;
    if (!layer) return;

    const prevLayer = layerRef.current;
    const layerChanged = prevLayer !== layer;
    layerRef.current = layer;
    dataRef.current = items;

    for (const [id, marker] of markersRef.current) {
      if (items.has(id)) continue;

      const rekeyed = tryRekeyRef.current?.(id, marker, items);
      if (rekeyed) {
        markersRef.current.delete(id);
        markersRef.current.set(rekeyed.newId, marker);
        bindClick(marker, rekeyed.newId);
        // Same layer-switch guard as the reattach branch below: detach from the
        // old layer first so the marker is never live on two layers at once.
        if (layerChanged) prevLayer?.removeLayer(marker);
        attachMarker(marker, clusterGroup, directMap);
        continue;
      }

      if (clusterGroup) clusterGroup.removeLayer(marker);
      else marker.remove();
      markersRef.current.delete(id);
    }

    for (const [id, item] of items) {
      const existing = markersRef.current.get(id);
      if (existing) {
        bindClick(existing, id);
        if (layerChanged) {
          // Detach from the previous layer before reattaching, so a marker is
          // never live on two layers at once (avoids duplicates / markercluster
          // parent-state errors when switching map <-> cluster group).
          prevLayer?.removeLayer(existing);
          attachMarker(existing, clusterGroup, directMap);
        }
        continue;
      }

      const marker = L.marker(getLatLngRef.current(item));
      applyVisualRef.current(marker, item);
      bindClick(marker, id);
      attachMarker(marker, clusterGroup, directMap);
      markersRef.current.set(id, marker);
    }
  }, [clusterRef, clusterGen, mapRef, mapReady, items, bindClick]);

  useEffect(() => {
    for (const [id, item] of items) {
      const marker = markersRef.current.get(id);
      if (marker) applyVisual(marker, item);
    }
  }, [items, clusterGen, applyVisual]);

  return markersRef;
}
