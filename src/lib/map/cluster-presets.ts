import type { MarkerClusterGroupOptions } from "./use-marker-cluster-group";

/** Shared cluster tuning for raw triage pin maps (icon fn supplied at call site). */
export const RAW_CLUSTER_PRESET: Omit<MarkerClusterGroupOptions, "iconCreateFunction"> = {
  chunkedLoading: true,
  maxClusterRadius: 40,
  showCoverageOnHover: false,
  spiderfyOnMaxZoom: true,
  zoomToBoundsOnClick: true,
};

/** Shared cluster tuning for browse circle maps (icon fn supplied at call site). */
export const BROWSE_CLUSTER_PRESET: Omit<MarkerClusterGroupOptions, "iconCreateFunction"> = {
  maxClusterRadius: 60,
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true,
  disableClusteringAtZoom: 16,
  animate: true,
};
