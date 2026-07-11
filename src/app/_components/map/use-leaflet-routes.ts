import L from "leaflet";
import { useEffect, useRef } from "react";

import { DEFAULT_BLOCK_COLOR } from "~/lib/map/colors";
import type { RouteData } from "~/types";
import { useInjectStyles } from "./use-inject-styles";

const ROUTE_STYLES = `
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

type LegPolyline = {
  polyline: L.Polyline;
  fromAttractionId: number;
  toAttractionId: number;
};

type DayPolylines = {
  main: L.Polyline;
  legs: LegPolyline[];
};

export const useLeafletRoutes = (
  mapRef: React.RefObject<L.Map | null>,
  blockRoutes: Map<number, RouteData>,
  blockColors: Map<number, string>,
  selectedBlockId: number | null,
  hoveredAttractionId: number | null,
  selectedAttractionId: number | null,
  isLoadingRoutes: boolean,
) => {
  const blockPolylinesRef = useRef<Map<number, DayPolylines>>(new Map());

  useInjectStyles("leaflet-route-styles", ROUTE_STYLES);

  // Rebuild polylines when routes/colors/selected-day change (not on hover/select)
  useEffect(() => {
    if (!mapRef.current || isLoadingRoutes) return;

    const map = mapRef.current;

    // Remove all existing polylines
    blockPolylinesRef.current.forEach(({ main, legs }) => {
      main.remove();
      legs.forEach(({ polyline }) => polyline.remove());
    });
    blockPolylinesRef.current.clear();

    blockRoutes.forEach((route, dayId) => {
      const color = blockColors.get(dayId) ?? DEFAULT_BLOCK_COLOR;
      const isSelectedBlock = dayId === selectedBlockId;

      const latLngs = route.geojson.geometry.coordinates.map(
        ([lng, lat]) => [lat, lng] as [number, number],
      );

      const main = L.polyline(latLngs, {
        color,
        weight: isSelectedBlock ? 4 : 3,
        opacity: isSelectedBlock ? 0.8 : 0.5,
        lineJoin: "round",
        lineCap: "round",
      }).addTo(map);

      const mainPath = main.getElement();
      if (mainPath instanceof SVGPathElement) {
        mainPath.classList.remove("route-pulse-animation");
        mainPath.style.animation = "none";
      }

      const legs: LegPolyline[] = [];

      if (isSelectedBlock && route.legs) {
        route.legs.forEach((leg) => {
          const legLatLngs = leg.geometryGeojsonParsed.coordinates.map(
            ([lng, lat]) => [lat, lng] as [number, number],
          );

          const legPolyline = L.polyline(legLatLngs, {
            color,
            weight: 5,
            opacity: 0,
            lineJoin: "round",
            lineCap: "round",
          }).addTo(map);

          legs.push({
            polyline: legPolyline,
            fromAttractionId: leg.fromAttractionId,
            toAttractionId: leg.toAttractionId,
          });
        });
      }

      blockPolylinesRef.current.set(dayId, { main, legs });
    });

    return () => {
      blockPolylinesRef.current.forEach(({ main, legs }) => {
        main.remove();
        legs.forEach(({ polyline }) => polyline.remove());
      });
      blockPolylinesRef.current.clear();
    };
  }, [mapRef, blockRoutes, blockColors, selectedBlockId, isLoadingRoutes]);

  // Update opacity/animation on existing polylines when hover/select changes.
  // Also depends on blockRoutes/isLoadingRoutes so styling is re-applied after rebuild.
  useEffect(() => {
    if (!mapRef.current) return;

    const hasActiveLeg =
      selectedBlockId !== null &&
      (selectedAttractionId !== null || hoveredAttractionId !== null) &&
      (() => {
        const dp = blockPolylinesRef.current.get(selectedBlockId);
        return dp?.legs.some(
          (l) =>
            l.fromAttractionId === selectedAttractionId ||
            l.toAttractionId === selectedAttractionId ||
            l.fromAttractionId === hoveredAttractionId ||
            l.toAttractionId === hoveredAttractionId,
        ) ?? false;
      })();

    blockPolylinesRef.current.forEach(({ main, legs }, dayId) => {
      const isSelectedBlock = dayId === selectedBlockId;

      // Main polyline opacity
      let weight = isSelectedBlock ? 4 : 3;
      let opacity = isSelectedBlock ? 0.8 : 0.5;
      if (isSelectedBlock && hasActiveLeg) {
        opacity = 0.3;
        weight = 2;
      }
      main.setStyle({ opacity, weight });

      // Leg polylines
      legs.forEach(({ polyline, fromAttractionId, toAttractionId }) => {
        const isLegSelected =
          selectedAttractionId === fromAttractionId ||
          selectedAttractionId === toAttractionId;
        const isLegHovered =
          hoveredAttractionId === fromAttractionId ||
          hoveredAttractionId === toAttractionId;

        const active = isLegSelected || isLegHovered;
        polyline.setStyle({
          weight: isLegSelected ? 7 : 5,
          opacity: active ? 1 : 0,
        });

        const path = polyline.getElement();
        if (path instanceof SVGPathElement) {
          if (isLegSelected) {
            path.style.animation = "";  // clear inline override before adding class
            path.classList.add("route-pulse-animation");
          } else {
            path.classList.remove("route-pulse-animation");
            path.style.animation = "none";
          }
        }
      });
    });
  }, [mapRef, hoveredAttractionId, selectedAttractionId, selectedBlockId, blockRoutes, isLoadingRoutes]);
};
