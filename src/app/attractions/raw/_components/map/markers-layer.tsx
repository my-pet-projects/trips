"use client";

import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";

import { useRawTriageContext } from "../raw-triage-context";
import type { ExistingMapAttraction, RawMapAttraction } from "../types";
import { toHighlightIconKey } from "../types";
import { FitBounds } from "./fit-bounds";
import { getIcon, rawIconKey, type TaggedMarker } from "./map-icons";
import { useMapDeselect } from "./use-map-deselect";
import { useMarkerCluster } from "./use-marker-cluster";
import { useMarkerSelection } from "./use-marker-selection";
import { useSyncedMarkers } from "./use-synced-markers";

export function MarkersLayer() {
  const {
    rawAttractions,
    existing,
    selection,
    selectRaw,
    selectExisting,
    clearSelection,
    resolveExistingId,
    promotionMapRef,
  } = useRawTriageContext();

  const cluster = useMarkerCluster(clearSelection);
  useMapDeselect(clearSelection);

  const existingMarkersRef = useRef<Map<number, L.Marker>>(new Map());
  const existingByIdRef = useRef<Map<number, ExistingMapAttraction>>(new Map());
  const rawMarkersRef = useRef<Map<number, L.Marker>>(new Map());
  const rawByIdRef = useRef<Map<number, RawMapAttraction>>(new Map());
  const rawStatusRef = useRef<Map<number, string>>(new Map());

  const onSelectExistingRef = useRef(selectExisting);
  const onSelectRawRef = useRef(selectRaw);
  onSelectExistingRef.current = selectExisting;
  onSelectRawRef.current = selectRaw;

  const existingById = useMemo(() => {
    const map = new Map<number, ExistingMapAttraction>();
    for (const a of existing) map.set(a.id, a);
    return map;
  }, [existing]);

  const rawById = useMemo(() => {
    const map = new Map<number, RawMapAttraction>();
    for (const r of rawAttractions) map.set(r.id, r);
    return map;
  }, [rawAttractions]);

  const bindExistingClick = (marker: L.Marker, id: number) => {
    marker.off("click");
    marker.on("click", () => {
      const current = existingByIdRef.current.get(id);
      if (current) onSelectExistingRef.current(current);
    });
  };

  const bindRawClick = (marker: L.Marker, id: number) => {
    marker.off("click");
    marker.on("click", () => {
      const current = rawByIdRef.current.get(id);
      if (current) onSelectRawRef.current(current);
    });
  };

  useSyncedMarkers({
    cluster,
    items: existingById,
    markersRef: existingMarkersRef,
    dataRef: existingByIdRef,
    bindClick: bindExistingClick,
    createMarker: (a) => {
      const key = toHighlightIconKey(a.highlight);
      const marker = L.marker([a.latitude, a.longitude], { icon: getIcon(key) });
      (marker as TaggedMarker).markerStatus = key;
      return marker;
    },
    tryRekey: (id, marker, items) => {
      if (id >= 0) return null;
      const rawId = -id;
      const promotedId = promotionMapRef.current?.get(rawId);
      if (promotedId === undefined || !items.has(promotedId)) return null;
      const item = items.get(promotedId)!;
      const key = toHighlightIconKey(item.highlight);
      marker.setIcon(getIcon(key));
      (marker as TaggedMarker).markerStatus = key;
      promotionMapRef.current?.delete(rawId);
      return { newId: promotedId, item };
    },
  });

  useSyncedMarkers({
    cluster,
    items: rawById,
    markersRef: rawMarkersRef,
    dataRef: rawByIdRef,
    bindClick: bindRawClick,
    createMarker: (r) => {
      const key = rawIconKey(r.status);
      rawStatusRef.current.set(r.id, r.status);
      const marker = L.marker([r.latitude, r.longitude], { icon: getIcon(key) });
      (marker as TaggedMarker).markerStatus = r.status;
      return marker;
    },
  });

  useMarkerSelection({
    selection,
    resolveExistingId,
    rawMarkersRef,
    existingMarkersRef,
    rawStatusRef,
    cluster,
  });

  return null;
}

export function RawTriageMap({ countryCode }: { countryCode?: string }) {
  const { allPoints } = useRawTriageContext();

  return (
    <>
      {allPoints.length > 0 && <FitBounds points={allPoints} countryCode={countryCode} />}
      <MarkersLayer />
    </>
  );
}
