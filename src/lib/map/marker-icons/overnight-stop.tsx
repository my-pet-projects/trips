import L from "leaflet";
import { BedDouble } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";

const MARKER_SIZE = 34;
const ICON_SIZE = 18;
const MARKER_COLOR = "#7c3aed";

export function overnightStopDivIcon(): L.DivIcon {
  const icon = renderToStaticMarkup(
    <BedDouble
      size={ICON_SIZE}
      strokeWidth={2.5}
      aria-hidden="true"
      style={{ display: "block", color: "white" }}
    />,
  );

  return L.divIcon({
    className: "custom-div-icon",
    html: `<div data-testid="overnight-stop-marker" style="
      align-items: center;
      background: ${MARKER_COLOR};
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
      display: flex;
      height: ${MARKER_SIZE}px;
      justify-content: center;
      transform: rotate(-45deg);
      width: ${MARKER_SIZE}px;
    "><div style="transform: rotate(45deg)">${icon}</div></div>`,
    iconSize: [MARKER_SIZE, MARKER_SIZE],
    iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE],
    tooltipAnchor: [0, -MARKER_SIZE],
  });
}
