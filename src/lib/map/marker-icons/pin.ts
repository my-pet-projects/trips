import L from "leaflet";

import {
  HIGHLIGHT_COLORS,
  RAW_STATUS_COLORS,
  UNRATED_MARKER_BORDER,
  type AttractionHighlightKey,
  type RawStatusKey,
} from "~/lib/map/colors";

export type PinIconKey = RawStatusKey | AttractionHighlightKey;

const PIN_ICON_CONFIGS: Record<PinIconKey, { color: string; size?: number }> = {
  pending: { color: RAW_STATUS_COLORS.pending.hex },
  rejected: { color: RAW_STATUS_COLORS.rejected.hex, size: 24 },
  duplicated: { color: RAW_STATUS_COLORS.duplicated.hex, size: 24 },
  must_see: { color: HIGHLIGHT_COLORS.must_see.hex, size: 28 },
  recommended: { color: HIGHLIGHT_COLORS.recommended.hex, size: 28 },
  skip: { color: HIGHLIGHT_COLORS.skip.hex, size: 24 },
  none: { color: HIGHLIGHT_COLORS.none.hex, size: 28 },
};

export const PIN_STATUS_COLORS = Object.fromEntries(
  Object.entries(PIN_ICON_CONFIGS).map(([key, value]) => [key, value.color]),
) as Record<PinIconKey, string>;

export const PIN_CLUSTER_SLICE_ORDER: PinIconKey[] = [
  "pending",
  "rejected",
  "duplicated",
  "must_see",
  "recommended",
  "skip",
  "none",
];

export function createPinDivIcon(color: string, size = 32, selected = false): L.DivIcon {
  const s = size;
  const outer = Math.round(s * 1.4);
  const halfOuter = outer / 2;
  const pinOffset = (outer - s) / 2;
  const anchorY = outer * 0.9;
  const selectedRing = selected
    ? `<circle cx='${halfOuter}' cy='${halfOuter}' r='${halfOuter - 2}' fill='none' stroke='#2563eb' stroke-width='3' opacity='0.95'/>`
    : "";
  const isUnrated = color.toLowerCase() === HIGHLIGHT_COLORS.none.hex.toLowerCase();
  const pinBody = isUnrated
    ? `<path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z' fill='white' stroke='${UNRATED_MARKER_BORDER}' stroke-width='1.5' filter='drop-shadow(0 2px 3px rgba(0,0,0,0.3))'/>
    <circle cx='12' cy='9' r='3.2' fill='white' stroke='${UNRATED_MARKER_BORDER}' stroke-width='1.2'/>`
    : `<path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z' fill='${color}' filter='drop-shadow(0 2px 3px rgba(0,0,0,0.3))'/>
    <circle cx='12' cy='9' r='3.2' fill='white' fill-opacity='0.9'/>
    <circle cx='12' cy='9' r='1.2' fill='${color}'/>`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${outer}' height='${outer}' viewBox='0 0 ${outer} ${outer}'>
${selectedRing}
<g transform='translate(${pinOffset},${pinOffset})'>
  <svg width='${s}' height='${s}' viewBox='0 0 24 24'>
    ${pinBody}
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

const pinIconCache: Partial<Record<string, L.DivIcon>> = {};

export function getPinIcon(key: PinIconKey, selected = false): L.DivIcon {
  const cfg = PIN_ICON_CONFIGS[key];
  const cacheKey = selected ? `${key}__selected` : key;
  return (pinIconCache[cacheKey] ??= createPinDivIcon(cfg.color, cfg.size, selected));
}

export function rawIconKey(status: string): RawStatusKey {
  if (status === "rejected") return "rejected";
  if (status === "duplicated") return "duplicated";
  return "pending";
}
