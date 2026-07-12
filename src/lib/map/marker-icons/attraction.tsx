import L, { divIcon } from "leaflet";
import type React from "react";
import { renderToStaticMarkup } from "react-dom/server";

/** Teardrop map-pin outline (24x24 viewBox). */
const PIN_TEARDROP_PATH =
  "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z";

/** Div icon rendered from a React icon component (e.g. a lucide icon). */
export function createDivIcon(
  IconComponent: React.ElementType,
  color: string,
  size: number,
): L.DivIcon {
  const iconHtml = renderToStaticMarkup(
    <IconComponent size={size} style={{ display: "block", color }} />,
  );

  return divIcon({
    html: iconHtml,
    className: "custom-div-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

/** Teardrop attraction pin with an optional pulsing halo. */
export function createAttractionIcon({
  color = "#ff4d4f",
  size = 40,
  pulse = true,
}: {
  color?: string;
  size?: number;
  pulse?: boolean;
} = {}): L.DivIcon {
  const s = Math.max(16, Math.min(128, size));
  const outer = Math.round(s * 1.4);
  const halfOuter = outer / 2;
  const outerThird = outer / 3;
  const pinOffset = (outer - s) / 2;
  const anchorY = outer * 0.9;

  const svg = `
<svg xmlns='http://www.w3.org/2000/svg' width='${outer}' height='${outer}' viewBox='0 0 ${outer} ${outer}'>
<style>
.pulse { 
  transform-origin: ${halfOuter}px ${halfOuter}px; 
  animation: pulse 1.8s infinite ease-out; 
}
@keyframes pulse { 
  0% { opacity: .6; transform: scale(0.9); } 
  60% { opacity: .14; transform: scale(1.5); } 
  100% { opacity: 0; transform: scale(1.8); } 
}
.pin { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25)); }
</style>

${pulse ? `<circle class='pulse' cx='${halfOuter}' cy='${halfOuter}' r='${outerThird}' fill='${color}' />` : ""}

<g class='pin' transform='translate(${pinOffset}, ${pinOffset})'>
  <svg x='0' y='0' width='${s}' height='${s}' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
    <path d='${PIN_TEARDROP_PATH}' fill='${color}' />
    <circle cx='12' cy='9' r='3.2' fill='white' fill-opacity='0.96' />
    <circle cx='12' cy='9' r='1.2' fill='${color}' />
  </svg>
</g>
</svg>
`;

  return L.divIcon({
    className: "leaflet-attraction-icon",
    html: svg,
    iconSize: [outer, outer],
    iconAnchor: [halfOuter, anchorY],
    popupAnchor: [0, -anchorY],
    tooltipAnchor: [0, -anchorY],
  });
}
