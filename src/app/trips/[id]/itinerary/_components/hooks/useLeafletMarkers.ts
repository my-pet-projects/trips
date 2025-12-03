import L from "leaflet";
import { useEffect, useRef } from "react";

import type { RouterOutputs } from "~/trpc/react";

type Attraction =
  RouterOutputs["attraction"]["getAttractionsByCountries"][number];

const createMarkerIcon = (
  color: string,
  size: number,
  isInDay: boolean,
  isHighlighted: boolean,
  orderNumber?: number,
) => {
  return `
    <div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 ${isHighlighted ? "4" : "2"}px ${isHighlighted ? "12" : "8"}px rgba(0,0,0,${isHighlighted ? "0.4" : "0.3"});
      cursor: pointer;
      transition: all 0.2s ease;
      ${isHighlighted ? "transform: scale(1.15);" : ""}
      position: relative;
      overflow: hidden;
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
        color: white;
        font-weight: 600;
        font-size: ${size > 28 ? "14px" : "12px"};
        line-height: 1;
        white-space: nowrap;
        text-align: center;
      ">
        ${orderNumber ?? (isInDay ? "●" : "")}
      </div>
    </div>
  `;
};

export const useLeafletMarkers = (
  mapRef: React.RefObject<L.Map | null>,
  attractions: Attraction[],
  attractionToDayMap: Map<number, number>,
  dayColors: Map<number, string>,
  hoveredAttractionId: number | null,
  selectedAttractionId: number | null,
  selectedDayId: number | null,
  selectedDayAttractionOrders: Map<number, number>,
  onMarkerClick: (attraction: Attraction) => void,
) => {
  const markersRef = useRef<Map<number, L.Marker>>(new Map());

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const markers = markersRef.current;

    // Clear existing markers
    markers.forEach((marker) => marker.remove());
    markers.clear();

    if (attractions.length === 0) return;

    attractions.forEach((attraction) => {
      if (!attraction.latitude || !attraction.longitude) return;

      const attractionDayId = attractionToDayMap.get(attraction.id);
      const isInAnyDay = attractionDayId !== undefined;
      const isInSelectedDay = attractionDayId === selectedDayId;
      const isHovered = hoveredAttractionId === attraction.id;
      const isSelected = selectedAttractionId === attraction.id;
      const orderNumber = selectedDayAttractionOrders.get(attraction.id);

      let color = "#9ca3af";
      if (isInAnyDay && attractionDayId !== undefined) {
        color = dayColors.get(attractionDayId) ?? "#9ca3af";
      }

      const baseSize = 26;
      const size = isSelected
        ? baseSize + 8
        : isHovered
          ? baseSize + 4
          : baseSize;
      const zIndexOffset = isSelected ? 1000 : isHovered ? 500 : 0;

      const iconHtml = createMarkerIcon(
        color,
        size,
        isInAnyDay,
        isHovered || isSelected,
        isInSelectedDay ? orderNumber : undefined,
      );

      const customIcon = L.divIcon({
        html: iconHtml,
        className: "custom-marker",
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([attraction.latitude, attraction.longitude], {
        icon: customIcon,
        title: attraction.name,
        zIndexOffset,
      })
        .addTo(map)
        .on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          onMarkerClick(attraction);
        });

      markers.set(attraction.id, marker);
    });

    // Cleanup function for markers
    return () => {
      markers.forEach((marker) => marker.remove());
      markers.clear();
    };
  }, [
    mapRef,
    attractions,
    attractionToDayMap,
    selectedDayId,
    dayColors,
    hoveredAttractionId,
    selectedAttractionId,
    selectedDayAttractionOrders,
    onMarkerClick,
  ]);

  return markersRef.current;
};
