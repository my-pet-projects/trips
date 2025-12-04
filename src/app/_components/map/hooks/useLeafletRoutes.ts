import L from "leaflet";
import { useEffect, useRef } from "react";

import type { RouterOutputs } from "~/trpc/react";

type RouteData = RouterOutputs["route"]["buildRoute"];

const ROUTE_STYLES = `
  /* Keyframes for pulsing selected route segments */
  @keyframes route-pulse {
    0%, 100% {
      opacity: 1;
      stroke-width: 6;
    }
    50% {
      opacity: 0.6;
      stroke-width: 8;
    }
  }

  .route-pulse-animation {
    animation: route-pulse 1.5s ease-in-out infinite;
  }
`;

export const useLeafletRoutes = (
  mapRef: React.RefObject<L.Map | null>,
  dayRoutes: Map<number, RouteData>,
  dayColors: Map<number, string>,
  selectedDayId: number | null,
  hoveredAttractionId: number | null,
  selectedAttractionId: number | null,
  isLoadingRoutes: boolean,
) => {
  const polylinesRef = useRef<L.Polyline[]>([]);

  // Effect to inject styles for route animations
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.id = "leaflet-route-styles";
    styleElement.textContent = ROUTE_STYLES;
    document.head.appendChild(styleElement);

    return () => {
      const existingStyle = document.getElementById("leaflet-route-styles");
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || isLoadingRoutes) return;

    const map = mapRef.current;

    polylinesRef.current.forEach((polyline) => polyline.remove());
    polylinesRef.current = [];

    // Track if any leg within the selected day is currently selected or hovered
    let hasActiveLegHighlight = false;
    if (selectedDayId && dayRoutes.has(selectedDayId)) {
      const route = dayRoutes.get(selectedDayId);
      if (route?.legs) {
        hasActiveLegHighlight = route.legs.some(
          (leg) =>
            selectedAttractionId === leg.fromAttractionId ||
            selectedAttractionId === leg.toAttractionId ||
            hoveredAttractionId === leg.fromAttractionId ||
            hoveredAttractionId === leg.toAttractionId,
        );
      }
    }

    dayRoutes.forEach((route, dayId) => {
      const color = dayColors.get(dayId) ?? "#3b82f6";
      const isSelectedDay = dayId === selectedDayId;

      const latLngs = route.geojson.geometry.coordinates.map(
        ([lng, lat]) => [lat, lng] as [number, number],
      );

      // Fade main polyline if not selected day or if there's an active leg highlight
      let mainPolylineOpacity = isSelectedDay ? 0.8 : 0.5;
      let mainPolylineWeight = isSelectedDay ? 4 : 3;

      // Further fade if there's an active leg highlight on the selected day
      if (isSelectedDay && hasActiveLegHighlight) {
        mainPolylineOpacity = 0.3;
        mainPolylineWeight = 2;
      }

      const mainPolyline = L.polyline(latLngs, {
        color: color,
        weight: mainPolylineWeight,
        opacity: mainPolylineOpacity,
        lineJoin: "round",
        lineCap: "round",
      }).addTo(map);

      // Ensure main polylines do NOT have the animation by default
      const mainPathElement = mainPolyline.getElement();
      if (mainPathElement instanceof SVGPathElement) {
        mainPathElement.classList.remove("route-pulse-animation");
        mainPathElement.style.animation = "none";
      }
      polylinesRef.current.push(mainPolyline);

      // Highlight legs if selected or hovered
      if (isSelectedDay && route.legs) {
        route.legs.forEach((leg) => {
          const isLegSelected =
            selectedAttractionId === leg.fromAttractionId ||
            selectedAttractionId === leg.toAttractionId;
          const isLegHovered =
            hoveredAttractionId === leg.fromAttractionId ||
            hoveredAttractionId === leg.toAttractionId;

          if (!isLegSelected && !isLegHovered) return;

          const legLatLngs = leg.geometryGeojsonParsed.coordinates.map(
            ([lng, lat]) => [lat, lng] as [number, number],
          );

          // Determine weight and opacity for highlighted legs
          const legWeight = isLegSelected ? 7 : 5;
          const legOpacity = 1;

          const highlightPolyline = L.polyline(legLatLngs, {
            color: color,
            weight: legWeight,
            opacity: legOpacity,
            lineJoin: "round",
            lineCap: "round",
          }).addTo(map);

          const highlightPathElement = highlightPolyline.getElement();
          if (highlightPathElement instanceof SVGPathElement) {
            if (isLegSelected) {
              // Selected leg: thicker, fully opaque, and pulsing
              highlightPathElement.classList.add("route-pulse-animation");
            } else {
              // Hovered leg (not selected): thicker, fully opaque, no pulsing
              highlightPathElement.classList.remove("route-pulse-animation");
              highlightPathElement.style.animation = "none";
            }
          }

          polylinesRef.current.push(highlightPolyline);
        });
      }
    });

    return () => {
      polylinesRef.current.forEach((polyline) => polyline.remove());
      polylinesRef.current = [];
    };
  }, [
    mapRef,
    dayRoutes,
    dayColors,
    selectedDayId,
    hoveredAttractionId,
    selectedAttractionId,
    isLoadingRoutes,
  ]);
};
