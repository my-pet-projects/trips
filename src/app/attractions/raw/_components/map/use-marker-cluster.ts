"use client";

import L from "leaflet";
import "leaflet.markercluster";
import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";

import { createClusterIcon } from "./map-icons";

export function useMarkerCluster(onClusterClick: () => void) {
  const map = useMap();
  const [cluster, setCluster] = useState<L.MarkerClusterGroup | null>(null);
  const onClusterClickRef = useRef(onClusterClick);
  onClusterClickRef.current = onClusterClick;

  useEffect(() => {
    const group = L.markerClusterGroup({
      iconCreateFunction: createClusterIcon,
      chunkedLoading: true,
      maxClusterRadius: 40,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
    });

    const handleClusterClick = () => {
      onClusterClickRef.current();
    };

    group.on("clusterclick", handleClusterClick);
    map.addLayer(group);
    setCluster(group);

    return () => {
      group.off("clusterclick", handleClusterClick);
      map.removeLayer(group);
      setCluster(null);
    };
  }, [map]);

  return cluster;
}
