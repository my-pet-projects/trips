"use client";

import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

import { existingAttractionPopup, rawAttractionPopup } from "./popup-content";
import {
  createClusterIcon,
  getIcon,
  type HighlightIconKey,
  type TaggedMarker,
} from "./map-icons";
import type { StatusFilter } from "./use-raw-triage";
import type { ExistingAttraction, RawAttraction } from "~/types";

export function FitBounds({ points, countryCode }: { points: [number, number][]; countryCode?: string }) {
  const map = useMap();
  const fittedForRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (fittedForRef.current !== countryCode && points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 12 });
      fittedForRef.current = countryCode;
    }
  }, [map, points, countryCode]);
  return null;
}

interface MarkersLayerProps {
  rawAttractions: RawAttraction[];
  existing: ExistingAttraction[];
  visibleStatuses: Set<StatusFilter>;
  visibleHighlights: Set<HighlightIconKey>;
  isMutating: boolean;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onDuplicated: (id: number) => void;
}

export function MarkersLayer({
  rawAttractions,
  existing,
  visibleStatuses,
  visibleHighlights,
  isMutating,
  onApprove,
  onReject,
  onDuplicated,
}: MarkersLayerProps) {
  const map = useMap();

  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  useEffect(() => {
    const cluster = L.markerClusterGroup({
      iconCreateFunction: createClusterIcon,
      chunkedLoading: true,
      maxClusterRadius: 40,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
    });
    map.addLayer(cluster);
    clusterRef.current = cluster;
    return () => { map.removeLayer(cluster); };
  }, [map]);

  const existingMarkersRef = useRef<Map<number, L.Marker>>(new Map());
  useEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;

    const highlightKey = (a: ExistingAttraction): HighlightIconKey =>
      (a.highlight as HighlightIconKey | null) ?? "none";

    const incoming = new Map(
      existing
        .filter((a) => visibleHighlights.has(highlightKey(a)))
        .map((a) => [a.id, a]),
    );

    for (const [id, marker] of existingMarkersRef.current) {
      if (!incoming.has(id)) {
        cluster.removeLayer(marker);
        existingMarkersRef.current.delete(id);
      }
    }

    for (const [id, a] of incoming) {
      if (existingMarkersRef.current.has(id)) continue;
      if (a.latitude == null || a.longitude == null) continue;
      const key = highlightKey(a);
      const marker = L.marker([a.latitude, a.longitude], { icon: getIcon(key) });
      (marker as TaggedMarker).markerStatus = key;
      marker.bindPopup(existingAttractionPopup(a), { maxWidth: 260 });
      cluster.addLayer(marker);
      existingMarkersRef.current.set(id, marker);
    }
  }, [existing, visibleHighlights]);

  const rawMarkersRef = useRef<Map<number, { marker: L.Marker; status: string }>>(new Map());
  useEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;

    const incoming = new Map(
      rawAttractions
        .filter((r) => r.status !== "approved" && visibleStatuses.has(r.status as StatusFilter))
        .map((r) => [r.id, r]),
    );

    for (const [id, { marker, status }] of rawMarkersRef.current) {
      const updated = incoming.get(id);
      if (!updated || updated.status !== status) {
        cluster.removeLayer(marker);
        rawMarkersRef.current.delete(id);
      }
    }

    for (const [id, r] of incoming) {
      if (rawMarkersRef.current.has(id)) continue;
      if (r.latitude == null || r.longitude == null) continue;

      const icon =
        r.status === "rejected"   ? getIcon("rejected")   :
        r.status === "duplicated" ? getIcon("duplicated") :
        getIcon("pending");

      const marker = L.marker([r.latitude, r.longitude], { icon });
      (marker as TaggedMarker).markerStatus = r.status;
      marker.bindPopup(rawAttractionPopup(r), { maxWidth: 280 });

      marker.on("popupopen", () => {
        const popup = marker.getPopup()?.getElement();
        if (!popup) return;
        popup.querySelectorAll<HTMLButtonElement>("button[data-action]").forEach((btn) => {
          btn.disabled = isMutating;
          btn.style.opacity = isMutating ? "0.5" : "1";
          btn.onclick = () => {
            if (isMutating) return;
            const action = btn.dataset.action;
            const btnId = Number(btn.dataset.id);
            if (action === "approve")         onApprove(btnId);
            else if (action === "reject")     onReject(btnId);
            else if (action === "duplicated") onDuplicated(btnId);
            marker.closePopup();
          };
        });
      });

      cluster.addLayer(marker);
      rawMarkersRef.current.set(id, { marker, status: r.status });
    }
  }, [rawAttractions, visibleStatuses, isMutating, onApprove, onReject, onDuplicated]);

  return null;
}
