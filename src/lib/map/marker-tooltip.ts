import type L from "leaflet";

export const MARKER_TOOLTIP_CLASS = "leaflet-marker-tooltip";

export const MARKER_TOOLTIP_OPTIONS: L.TooltipOptions = {
  direction: "top",
  offset: [0, -6],
  opacity: 1,
  className: MARKER_TOOLTIP_CLASS,
  sticky: true,
};

export function bindMarkerTooltip(marker: L.Marker, label: string) {
  const text = label.trim();
  marker.unbindTooltip();
  if (!text) return;

  const element = document.createElement("span");
  element.textContent = text;
  marker.bindTooltip(element, MARKER_TOOLTIP_OPTIONS);
}
