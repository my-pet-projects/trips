"use client";

import type L from "leaflet";
import { useEffect, type RefObject } from "react";
import { useMap } from "react-leaflet";

import type { HighlightIconKey, TriageSelection } from "../types";
import { getIcon, rawIconKey, type TaggedMarker } from "./map-icons";

type UseMarkerSelectionOptions = {
  selection: TriageSelection | null;
  resolveExistingId: (id: number) => number;
  rawMarkersRef: RefObject<Map<number, L.Marker>>;
  existingMarkersRef: RefObject<Map<number, L.Marker>>;
  rawStatusRef: RefObject<Map<number, string>>;
  cluster: L.MarkerClusterGroup | null;
};

export function useMarkerSelection({
  selection,
  resolveExistingId,
  rawMarkersRef,
  existingMarkersRef,
  rawStatusRef,
  cluster,
}: UseMarkerSelectionOptions) {
  const map = useMap();

  useEffect(() => {
    const clusterGroup = cluster;
    if (!clusterGroup) return;

    const selectedRawId = selection?.kind === "raw" ? selection.attraction.id : null;
    const selectedExistingId =
      selection?.kind === "existing"
        ? resolveExistingId(selection.attraction.id)
        : null;

    for (const [id, marker] of rawMarkersRef.current) {
      const status = rawStatusRef.current.get(id) ?? "pending";
      const key = rawIconKey(status);
      const isSelected = id === selectedRawId;
      marker.setIcon(getIcon(key, isSelected));
      marker.setZIndexOffset(isSelected ? 1000 : 0);
    }

    for (const [id, marker] of existingMarkersRef.current) {
      const key = ((marker as TaggedMarker).markerStatus ?? "none") as HighlightIconKey;
      const isSelected = id === selectedExistingId;
      marker.setIcon(getIcon(key, isSelected));
      marker.setZIndexOffset(isSelected ? 1000 : 0);
    }

    if (!selection) return;

    let target: L.Marker | undefined;
    if (selection.kind === "raw") {
      target = rawMarkersRef.current.get(selection.attraction.id);
    } else {
      target =
        existingMarkersRef.current.get(selection.attraction.id) ??
        (selectedExistingId !== null
          ? existingMarkersRef.current.get(selectedExistingId)
          : undefined);
    }

    if (!target) return;

    clusterGroup.zoomToShowLayer(target, () => {
      map.panTo(target!.getLatLng(), { animate: true, duration: 0.35 });
    });
  }, [
    selection,
    map,
    cluster,
    resolveExistingId,
    rawMarkersRef,
    existingMarkersRef,
    rawStatusRef,
  ]);
}
