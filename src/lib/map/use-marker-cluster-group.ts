"use client";

import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { useLayoutEffect, useRef, useState, type RefObject } from "react";

import { createTaggedClusterIcon } from "./cluster-icon";

export type MarkerClusterGroupHandle = {
  clusterRef: RefObject<L.MarkerClusterGroup | null>;
  clusterGen: number;
};

/** Cluster group bound to an imperative map ref (waits until mapReady). */
export function useMarkerClusterGroup(
  mapRef: RefObject<L.Map | null>,
  enabled: boolean,
  mapReady: boolean,
  onClusterClick?: () => void,
): MarkerClusterGroupHandle {
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const [clusterGen, setClusterGen] = useState(0);
  const onClusterClickRef = useRef(onClusterClick);
  onClusterClickRef.current = onClusterClick;

  useLayoutEffect(() => {
    const map = mapRef.current;
    if (!map || !enabled || !mapReady) {
      clusterRef.current = null;
      setClusterGen((g) => g + 1);
      return;
    }

    const group = L.markerClusterGroup({
      iconCreateFunction: createTaggedClusterIcon,
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
    });
    const handleClusterClick = () => onClusterClickRef.current?.();
    group.on("clusterclick", handleClusterClick);
    map.addLayer(group);

    clusterRef.current = group;
    setClusterGen((g) => g + 1);

    return () => {
      group.off("clusterclick", handleClusterClick);
      map.removeLayer(group);
      clusterRef.current = null;
      setClusterGen((g) => g + 1);
    };
  }, [mapRef, enabled, mapReady]);

  return { clusterRef, clusterGen };
}
