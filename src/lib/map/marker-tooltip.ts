import type L from "leaflet";

export const MARKER_TOOLTIP_CLASS = "leaflet-marker-tooltip";

export const MARKER_TOOLTIP_OPTIONS: L.TooltipOptions = {
  direction: "top",
  offset: [0, -6],
  opacity: 1,
  className: MARKER_TOOLTIP_CLASS,
  sticky: true,
};

export function getMarkerTooltipText(content: unknown): string | null {
  if (content == null || content === false) return null;
  if (typeof content === "function") return null;
  if (typeof content === "string") return content.trim();
  if (content instanceof HTMLElement) return content.textContent?.trim() ?? "";
  return null;
}

export function bindMarkerTooltip(marker: L.Marker, label: string) {
  const text = label.trim();
  marker.unbindTooltip();
  if (!text) return;

  const element = document.createElement("span");
  element.textContent = text;
  marker.bindTooltip(element, MARKER_TOOLTIP_OPTIONS);
}
