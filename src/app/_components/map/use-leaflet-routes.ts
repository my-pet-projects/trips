import L from "leaflet";
import { useEffect, useRef } from "react";

import { formatRouteLegStats } from "~/lib/itinerary/format-route-stats";
import { DEFAULT_BLOCK_COLOR } from "~/lib/map/colors";
import { OVERNIGHT_STOP_COLOR } from "~/lib/map/marker-icons/overnight-stop";
import type { LabeledConnectorRoute, RouteData } from "~/types";
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
  fromAttractionId: number | null;
  toAttractionId: number | null;
};

type DayPolylines = {
  main: L.Polyline[];
  legs: LegPolyline[];
};

/** Legs touching a bare coordinate have no attraction id, so null never matches. */
const matchesAttraction = (
  legAttractionId: number | null,
  attractionId: number | null,
) => legAttractionId !== null && legAttractionId === attractionId;

export const useLeafletRoutes = (
  mapRef: React.RefObject<L.Map | null>,
  blockRoutes: Map<number, RouteData>,
  labeledConnectorRoutes: LabeledConnectorRoute[],
  blockColors: Map<number, string>,
  selectedBlockId: number | null,
  hoveredAttractionId: number | null,
  selectedAttractionId: number | null,
  isLoadingRoutes: boolean,
) => {
  const blockPolylinesRef = useRef<Map<number, DayPolylines>>(new Map());
  const connectorPolylinesRef = useRef<L.Polyline[]>([]);

  useInjectStyles("leaflet-route-styles", ROUTE_STYLES);

  useEffect(() => {
    if (!mapRef.current || isLoadingRoutes) return;

    const map = mapRef.current;

    blockPolylinesRef.current.forEach(({ main, legs }) => {
      main.forEach((polyline) => polyline.remove());
      legs.forEach(({ polyline }) => polyline.remove());
    });
    blockPolylinesRef.current.clear();

    blockRoutes.forEach((route, dayId) => {
      const color = blockColors.get(dayId) ?? DEFAULT_BLOCK_COLOR;
      const isSelectedBlock = dayId === selectedBlockId;

      const main = route.legs.map((leg) => {
        const latLngs = leg.geometry.coordinates.map(
          ([lng, lat]) => [lat, lng] as [number, number],
        );
        const isDriving = leg.travelMode === "driving";
        const polyline = L.polyline(latLngs, {
          color,
          weight: isSelectedBlock ? 4 : 3,
          opacity: isSelectedBlock ? 0.8 : 0.5,
          dashArray: isDriving ? "10 8" : undefined,
          lineJoin: "round",
          lineCap: isDriving ? "butt" : "round",
        }).addTo(map);

        polyline.bindTooltip(
          `${isDriving ? "Driving" : "Walking"} · ${formatRouteLegStats(leg.distanceMeters, leg.durationSeconds)}`,
          { sticky: true },
        );

        const path = polyline.getElement();
        if (path instanceof SVGPathElement) {
          path.classList.remove("route-pulse-animation");
          path.style.animation = "none";
        }

        return { polyline, latLngs };
      });

      const legs: LegPolyline[] = [];

      if (isSelectedBlock) {
        route.legs.forEach((leg, i) => {
          const legPolyline = L.polyline(main[i]!.latLngs, {
            color,
            weight: 5,
            opacity: 0,
            dashArray: leg.travelMode === "driving" ? "10 8" : undefined,
            lineJoin: "round",
            lineCap: leg.travelMode === "driving" ? "butt" : "round",
          }).addTo(map);

          legs.push({
            polyline: legPolyline,
            fromAttractionId: leg.fromAttractionId,
            toAttractionId: leg.toAttractionId,
          });
        });
      }

      blockPolylinesRef.current.set(dayId, {
        main: main.map((m) => m.polyline),
        legs,
      });
    });

    return () => {
      blockPolylinesRef.current.forEach(({ main, legs }) => {
        main.forEach((polyline) => polyline.remove());
        legs.forEach(({ polyline }) => polyline.remove());
      });
      blockPolylinesRef.current.clear();
    };
  }, [mapRef, blockRoutes, blockColors, selectedBlockId, isLoadingRoutes]);

  useEffect(() => {
    if (!mapRef.current) return;

    connectorPolylinesRef.current.forEach((polyline) => polyline.remove());
    connectorPolylinesRef.current = [];

    if (isLoadingRoutes) return;

    const map = mapRef.current;

    for (const { label, data } of labeledConnectorRoutes) {
      const latLngs = data.geometry.coordinates.map(
        ([lng, lat]) => [lat, lng] as [number, number],
      );
      const stats = formatRouteLegStats(
        data.distanceMeters,
        data.durationSeconds,
      );
      const mode = data.travelMode === "driving" ? "Driving" : "Walking";
      const polyline = L.polyline(latLngs, {
        color: OVERNIGHT_STOP_COLOR,
        weight: 4,
        opacity: 0.6,
        dashArray: "8 10",
        lineJoin: "round",
        lineCap: "round",
      }).addTo(map);
      polyline.bindTooltip(`${label} · ${stats} (${mode})`, { sticky: true });
      connectorPolylinesRef.current.push(polyline);
    }

    return () => {
      connectorPolylinesRef.current.forEach((polyline) => polyline.remove());
      connectorPolylinesRef.current = [];
    };
  }, [mapRef, labeledConnectorRoutes, isLoadingRoutes]);

  useEffect(() => {
    if (!mapRef.current) return;

    const hasActiveLeg =
      selectedBlockId !== null &&
      (selectedAttractionId !== null || hoveredAttractionId !== null) &&
      (() => {
        const dp = blockPolylinesRef.current.get(selectedBlockId);
        return (
          dp?.legs.some(
            (l) =>
              matchesAttraction(l.fromAttractionId, selectedAttractionId) ||
              matchesAttraction(l.toAttractionId, selectedAttractionId) ||
              matchesAttraction(l.fromAttractionId, hoveredAttractionId) ||
              matchesAttraction(l.toAttractionId, hoveredAttractionId),
          ) ?? false
        );
      })();

    blockPolylinesRef.current.forEach(({ main, legs }, dayId) => {
      const isSelectedBlock = dayId === selectedBlockId;

      let weight = isSelectedBlock ? 4 : 3;
      let opacity = isSelectedBlock ? 0.8 : 0.5;
      if (isSelectedBlock && hasActiveLeg) {
        opacity = 0.3;
        weight = 2;
      }
      main.forEach((polyline) => polyline.setStyle({ opacity, weight }));

      legs.forEach(({ polyline, fromAttractionId, toAttractionId }) => {
        const isLegSelected =
          matchesAttraction(fromAttractionId, selectedAttractionId) ||
          matchesAttraction(toAttractionId, selectedAttractionId);
        const isLegHovered =
          matchesAttraction(fromAttractionId, hoveredAttractionId) ||
          matchesAttraction(toAttractionId, hoveredAttractionId);

        const active = isLegSelected || isLegHovered;
        polyline.setStyle({
          weight: isLegSelected ? 7 : 5,
          opacity: active ? 1 : 0,
        });

        const path = polyline.getElement();
        if (path instanceof SVGPathElement) {
          if (isLegSelected) {
            path.style.animation = "";
            path.classList.add("route-pulse-animation");
          } else {
            path.classList.remove("route-pulse-animation");
            path.style.animation = "none";
          }
        }
      });
    });
  }, [
    mapRef,
    hoveredAttractionId,
    selectedAttractionId,
    selectedBlockId,
    blockRoutes,
    isLoadingRoutes,
  ]);
};
