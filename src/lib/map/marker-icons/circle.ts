import L from "leaflet";

import { ATTRACTION_MARKER_COLORS } from "~/lib/map/marker-meta";
import { HIGHLIGHT_COLORS, UNRATED_MARKER_BORDER } from "~/lib/map/colors";

export const BASE_CIRCLE_MARKER_SIZE = 26;
export const DEFAULT_CIRCLE_COLOR = HIGHLIGHT_COLORS.none.hex;
const VERIFIED_RING_WIDTH = 3;

export type CircleMarkerIconOptions = {
  color: string;
  size?: number;
  isInDay?: boolean;
  isHighlighted?: boolean;
  orderNumber?: number;
  isVerified?: boolean;
};

export type CircleMarkerIconResult = {
  html: string;
  iconSize: number;
  iconAnchor: number;
};

export function createCircleMarkerIcon({
  color,
  size = BASE_CIRCLE_MARKER_SIZE,
  isInDay = false,
  isHighlighted = false,
  orderNumber,
  isVerified = false,
}: CircleMarkerIconOptions): CircleMarkerIconResult {
  const showVerifiedRing = isVerified;
  const outerSize = showVerifiedRing ? size + VERIFIED_RING_WIDTH * 2 : size;
  const isUnrated = color.toLowerCase() === HIGHLIGHT_COLORS.none.hex.toLowerCase();
  const border = isUnrated ? `3px solid ${UNRATED_MARKER_BORDER}` : "3px solid white";

  const innerHtml = `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: ${border};
        box-shadow: 0 ${isHighlighted ? "4" : "2"}px ${isHighlighted ? "12" : "8"}px rgba(0,0,0,${isHighlighted ? "0.4" : "0.3"});
        cursor: pointer;
        transition: all 0.2s ease;
        ${isHighlighted ? "transform: scale(1.15);" : ""}
        position: relative;
        overflow: hidden;
        flex-shrink: 0;
      ">
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${isUnrated ? UNRATED_MARKER_BORDER : "white"};
          font-weight: 600;
          font-size: ${size > 28 ? "14px" : "12px"};
          line-height: 1;
          white-space: nowrap;
          text-align: center;
        ">
          ${orderNumber ?? (isInDay ? "●" : "")}
        </div>
      </div>`;

  const html = showVerifiedRing
    ? `<div style="
        width: ${outerSize}px;
        height: ${outerSize}px;
        border-radius: 50%;
        background: ${ATTRACTION_MARKER_COLORS.verified};
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        cursor: pointer;
      ">${innerHtml}</div>`
    : innerHtml;

  return { html, iconSize: outerSize, iconAnchor: outerSize / 2 };
}

function buildDivIcon(icon: CircleMarkerIconResult): L.DivIcon {
  return L.divIcon({
    html: icon.html,
    className: "custom-marker",
    iconSize: [icon.iconSize, icon.iconSize],
    iconAnchor: [icon.iconAnchor, icon.iconAnchor],
  });
}

export function applyCircleMarkerIcon(marker: L.Marker, icon: CircleMarkerIconResult) {
  marker.setIcon(buildDivIcon(icon));
}

export function circleMarkerDivIcon(options: CircleMarkerIconOptions): L.DivIcon {
  return buildDivIcon(createCircleMarkerIcon(options));
}

export type CircleTaggedMarker = L.Marker & {
  _metaTag?: string;
  _metaColor?: string;
};
