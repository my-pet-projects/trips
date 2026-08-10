import L from "leaflet";
import { useEffect, useRef } from "react";

import { formatRouteLegStats } from "~/lib/itinerary/format-route-stats";
import { DEFAULT_BLOCK_COLOR } from "~/lib/map/colors";
import { OVERNIGHT_STOP_COLOR } from "~/lib/map/marker-icons/overnight-stop";
import type { OvernightLegResult, RouteData } from "~/types";
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
  overnightLegs: Map<number, OvernightLegResult>,
  blockColors: Map<number, string>,
  selectedBlockId: number | null,
  hoveredAttractionId: number | null,
  selectedAttractionId: number | null,
  isLoadingRoutes: boolean,
) => {
  const blockPolylinesRef = useRef<Map<number, DayPolylines>>(new Map());
  // Separate ref so the overnight effect can clean up its own polylines
  // without racing against the main block-routes rebuild.
  const overnightPolylinesRef = useRef<Map<number, L.Polyline[]>>(new Map());

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
        const latLngs = leg.geometryGeojsonParsed.coordinates.map(
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

  // Render overnight legs independently — not gated on isLoadingRoutes so they
  // appear even before or after the main block-route queries settle.
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    overnightPolylinesRef.current.forEach((polylines) =>
      polylines.forEach((p) => p.remove()),
    );
    overnightPolylinesRef.current.clear();

    const renderOvernightPolyline = (
      data: OvernightLegResult["departure"] | OvernightLegResult["arrival"],
      label: string,
      isSelectedBlock: boolean,
    ) => {
      if (!data?.data) return null;
      const latLngs = data.data.geometry.coordinates.map(
        ([lng, lat]) => [lat, lng] as [number, number],
      );
      const stats = formatRouteLegStats(
        data.data.distanceMeters,
        data.data.durationSeconds,
      );
      const mode = data.data.travelMode === "driving" ? "Driving" : "Walking";
      const pl = L.polyline(latLngs, {
        color: OVERNIGHT_STOP_COLOR,
        weight: isSelectedBlock ? 5 : 4,
        opacity: isSelectedBlock ? 0.9 : 0.6,
        dashArray: "8 10",
        lineJoin: "round",
        lineCap: "round",
      }).addTo(map);
      pl.bindTooltip(`${label} · ${stats} (${mode})`, { sticky: true });
      return pl;
    };

    overnightLegs.forEach((overnightLeg, dayId) => {
      const isSelectedBlock = dayId === selectedBlockId;
      const polylines: L.Polyline[] = [];

      const dep = renderOvernightPolyline(
        overnightLeg.departure,
        "From hotel",
        isSelectedBlock,
      );
      const arr = renderOvernightPolyline(
        overnightLeg.arrival,
        "To hotel",
        isSelectedBlock,
      );
      if (dep) polylines.push(dep);
      if (arr) polylines.push(arr);

      if (polylines.length > 0) {
        overnightPolylinesRef.current.set(dayId, polylines);
      }
    });

    return () => {
      overnightPolylinesRef.current.forEach((polylines) =>
        polylines.forEach((p) => p.remove()),
      );
      overnightPolylinesRef.current.clear();
    };
  }, [mapRef, overnightLegs, selectedBlockId]);

  // Depends on blockRoutes/isLoadingRoutes so styling is re-applied after a rebuild.
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

      overnightPolylinesRef.current
        .get(dayId)
        ?.forEach((p) => p.setStyle({ opacity, weight }));

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
            path.style.animation = ""; // clear inline override before adding class
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
    overnightLegs,
    isLoadingRoutes,
  ]);
};
