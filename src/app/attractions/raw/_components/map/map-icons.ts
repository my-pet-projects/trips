import L from "leaflet";

import { createPieClusterIcon } from "~/lib/map/cluster-icon";
import {
  HIGHLIGHT_COLORS,
  RAW_STATUS_COLORS,
  type AttractionHighlightKey,
  type RawStatusKey,
} from "~/lib/map/colors";

function createPinIcon(color: string, size = 32, selected = false) {
  const s = size;
  const outer = Math.round(s * 1.4);
  const halfOuter = outer / 2;
  const pinOffset = (outer - s) / 2;
  const anchorY = outer * 0.9;
  const selectedRing = selected
    ? `<circle cx='${halfOuter}' cy='${halfOuter}' r='${halfOuter - 2}' fill='none' stroke='#2563eb' stroke-width='3' opacity='0.95'/>`
    : "";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${outer}' height='${outer}' viewBox='0 0 ${outer} ${outer}'>
${selectedRing}
<g transform='translate(${pinOffset},${pinOffset})'>
  <svg width='${s}' height='${s}' viewBox='0 0 24 24'>
    <path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z' fill='${color}' filter='drop-shadow(0 2px 3px rgba(0,0,0,0.3))'/>
    <circle cx='12' cy='9' r='3.2' fill='white' fill-opacity='0.9'/>
    <circle cx='12' cy='9' r='1.2' fill='${color}'/>
  </svg>
</g></svg>`;
  return L.divIcon({
    className: selected ? "leaflet-raw-icon leaflet-raw-icon--selected" : "leaflet-raw-icon",
    html: svg,
    iconSize: [outer, outer],
    iconAnchor: [halfOuter, anchorY],
    popupAnchor: [0, -anchorY],
    tooltipAnchor: [0, -anchorY],
  });
}

type IconKey = RawStatusKey | AttractionHighlightKey;

const ICON_CONFIGS: Record<IconKey, { color: string; size?: number }> = {
  pending: { color: RAW_STATUS_COLORS.pending.hex },
  rejected: { color: RAW_STATUS_COLORS.rejected.hex, size: 24 },
  duplicated: { color: RAW_STATUS_COLORS.duplicated.hex, size: 24 },
  must_see: { color: HIGHLIGHT_COLORS.must_see.hex, size: 28 },
  recommended: { color: HIGHLIGHT_COLORS.recommended.hex, size: 28 },
  skip: { color: HIGHLIGHT_COLORS.skip.hex, size: 24 },
  none: { color: HIGHLIGHT_COLORS.none.hex, size: 28 },
};

const CLUSTER_SLICE_ORDER: IconKey[] = [
  "pending",
  "rejected",
  "duplicated",
  "must_see",
  "recommended",
  "skip",
  "none",
];

export const STATUS_COLOR: Record<string, string> = Object.fromEntries(
  Object.entries(ICON_CONFIGS).map(([k, v]) => [k, v.color]),
);

const iconCache: Partial<Record<string, L.DivIcon>> = {};

export function rawIconKey(status: string): RawStatusKey {
  if (status === "rejected") return "rejected";
  if (status === "duplicated") return "duplicated";
  return "pending";
}

export function getIcon(key: IconKey, selected = false): L.DivIcon {
  const cfg = ICON_CONFIGS[key];
  const cacheKey = selected ? `${key}__selected` : key;
  return (iconCache[cacheKey] ??= createPinIcon(cfg.color, cfg.size, selected));
}

export type TaggedMarker = L.Marker & { markerStatus: string };

export function createClusterIcon(cluster: L.MarkerCluster) {
  return createPieClusterIcon(
    cluster,
    (group) => {
      const tally: Record<string, number> = {};
      for (const m of group.getAllChildMarkers()) {
        const status = (m as TaggedMarker).markerStatus ?? "none";
        tally[status] = (tally[status] ?? 0) + 1;
      }
      return CLUSTER_SLICE_ORDER.map((key) => ({
        color: STATUS_COLOR[key]!,
        count: tally[key] ?? 0,
      }));
    },
    { innerRadiusRatio: 0.5, dropShadow: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))" },
  );
}
