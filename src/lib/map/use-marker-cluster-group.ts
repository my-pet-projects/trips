"use client";

import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { useLayoutEffect, useRef, useState, type RefObject } from "react";

export type MarkerClusterGroupOptions = {
  iconCreateFunction: (cluster: L.MarkerCluster) => L.DivIcon;
  maxClusterRadius?: number;
  chunkedLoading?: boolean;
  spiderfyOnMaxZoom?: boolean;
  showCoverageOnHover?: boolean;
  zoomToBoundsOnClick?: boolean;
  disableClusteringAtZoom?: number;
  animate?: boolean;
  onClusterClick?: () => void;
};

function createClusterGroup(
  map: L.Map,
  optionsRef: RefObject<MarkerClusterGroupOptions>,
) {
  const options = optionsRef.current;
  const group = L.markerClusterGroup({
    iconCreateFunction: options.iconCreateFunction,
    maxClusterRadius: options.maxClusterRadius ?? 60,
    chunkedLoading: options.chunkedLoading ?? false,
    spiderfyOnMaxZoom: options.spiderfyOnMaxZoom ?? true,
    showCoverageOnHover: options.showCoverageOnHover ?? false,
    zoomToBoundsOnClick: options.zoomToBoundsOnClick ?? true,
    disableClusteringAtZoom: options.disableClusteringAtZoom,
    animate: options.animate ?? true,
  });

  const handleClusterClick = () => optionsRef.current.onClusterClick?.();
  group.on("clusterclick", handleClusterClick);

  map.addLayer(group);

  return {
    group,
    cleanup: () => {
      group.off("clusterclick", handleClusterClick);
      map.removeLayer(group);
    },
  };
}

export type MarkerClusterGroupHandle = {
  clusterRef: RefObject<L.MarkerClusterGroup | null>;
  clusterGen: number;
};

/** Cluster group bound to an imperative map ref (waits until mapReady). */
export function useMarkerClusterGroup(
  mapRef: RefObject<L.Map | null>,
  options: MarkerClusterGroupOptions,
  enabled: boolean,
  mapReady: boolean,
): MarkerClusterGroupHandle {
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const [clusterGen, setClusterGen] = useState(0);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useLayoutEffect(() => {
    const map = mapRef.current;
    if (!map || !enabled || !mapReady) {
      clusterRef.current = null;
      setClusterGen((g) => g + 1);
      return;
    }

    const { group, cleanup } = createClusterGroup(map, optionsRef);
    clusterRef.current = group;
    setClusterGen((g) => g + 1);

    return () => {
      cleanup();
      clusterRef.current = null;
      setClusterGen((g) => g + 1);
    };
  }, [mapRef, enabled, mapReady]);

  return { clusterRef, clusterGen };
}
