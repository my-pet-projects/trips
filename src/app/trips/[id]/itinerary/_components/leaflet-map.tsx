"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef } from "react";

import type { RouterOutputs } from "~/trpc/react";

type Attraction =
  RouterOutputs["attraction"]["getAttractionsByCountries"][number];
type Trip = RouterOutputs["trip"]["getWithItinerary"];
type BasicAttraction =
  Trip["itineraryDays"][number]["itineraryDayPlaces"][number]["attraction"];

type LeafletMapProps = {
  attractions: Attraction[];
  selectedDayAttractions: BasicAttraction[];
  selectedDayId: number | null;
  attractionToDayMap: Map<number, number>;
  dayColors: Map<number, string>;
  hoveredAttractionId: number | null;
  selectedAttractionId: number | null;
  panelHeight: number;
  onMarkerClick: (attraction: Attraction) => void;
};

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
      box-shadow: 0 2px 8px rgba(0,0,0,${isHighlighted ? "0.4" : "0.3"});
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

// Calculate initial center from attractions
const getInitialMapCenter = (attractions: Attraction[]): [number, number] => {
  const validAttractions = attractions.filter((a) => a.latitude && a.longitude);

  if (validAttractions.length === 0) {
    return [48.8566, 2.3522]; // Fallback to Paris
  }

  const avgLat =
    validAttractions.reduce((sum, a) => sum + a.latitude!, 0) /
    validAttractions.length;
  const avgLng =
    validAttractions.reduce((sum, a) => sum + a.longitude!, 0) /
    validAttractions.length;

  return [avgLat, avgLng];
};

export default function LeafletMap({
  attractions,
  selectedDayAttractions,
  selectedDayId,
  attractionToDayMap,
  dayColors,
  hoveredAttractionId,
  selectedAttractionId,
  panelHeight,
  onMarkerClick,
}: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const hasInitializedBounds = useRef(false);

  // Get order number for attractions in selected day
  const selectedDayAttractionOrders = useMemo(() => {
    const map = new Map<number, number>();
    selectedDayAttractions.forEach((attr, index) => {
      map.set(attr.id, index + 1);
    });
    return map;
  }, [selectedDayAttractions]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center = getInitialMapCenter(attractions);
    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView(center, 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      minZoom: 3,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      hasInitializedBounds.current = false;
    };
  }, [attractions]);

  // Center map on selected attraction with panel offset
  useEffect(() => {
    if (!mapRef.current || !selectedAttractionId) return;

    const attraction = attractions.find((a) => a.id === selectedAttractionId);
    if (!attraction?.latitude || !attraction?.longitude) return;

    const map = mapRef.current;

    // Use setTimeout to ensure panel height is measured after DOM update
    const timeoutId = setTimeout(() => {
      const offset = panelHeight > 0 ? panelHeight / 2 : 0;
      const targetLatLng = L.latLng(
        attraction.latitude!,
        attraction.longitude!,
      );
      const zoom = map.getZoom() < 15 ? 15 : map.getZoom();
      const targetPoint = map.project(targetLatLng, zoom);
      const offsetPoint = L.point(targetPoint.x, targetPoint.y + offset);
      const offsetLatLng = map.unproject(offsetPoint, zoom);

      map.setView(offsetLatLng, zoom, {
        animate: true,
        duration: 0.5,
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [selectedAttractionId, attractions, panelHeight]);

  // Center map on selected day's attractions when day changes (but not when attraction is selected)
  useEffect(() => {
    if (!mapRef.current || !selectedDayId || selectedAttractionId) return;

    const map = mapRef.current;
    const validAttractions = selectedDayAttractions.filter(
      (a) => a.latitude && a.longitude,
    );

    if (validAttractions.length === 0) return;

    // Small delay to ensure markers are rendered
    const timeoutId = setTimeout(() => {
      if (validAttractions.length === 1) {
        const attraction = validAttractions[0]!;
        map.setView([attraction.latitude!, attraction.longitude!], 14, {
          animate: true,
          duration: 0.5,
        });
      } else {
        const bounds = L.latLngBounds(
          validAttractions.map((a) => [a.latitude!, a.longitude!]),
        );
        map.fitBounds(bounds, {
          padding: [60, 60],
          maxZoom: 15,
          animate: true,
          duration: 0.5,
        });
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [selectedDayId, selectedDayAttractions, selectedAttractionId]);

  // Update markers when attractions or state changes
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const markers = markersRef.current;

    // Clear existing markers
    markers.forEach((marker) => marker.remove());
    markers.clear();

    if (attractions.length === 0) return;

    const bounds = L.latLngBounds([]);
    let hasValidCoordinates = false;

    // Add markers for each attraction
    attractions.forEach((attraction) => {
      if (!attraction.latitude || !attraction.longitude) return;

      hasValidCoordinates = true;
      const attractionDayId = attractionToDayMap.get(attraction.id);
      const isInAnyDay = attractionDayId !== undefined;
      const isInSelectedDay = attractionDayId === selectedDayId;
      const isHovered = hoveredAttractionId === attraction.id;
      const isSelected = selectedAttractionId === attraction.id;
      const orderNumber = selectedDayAttractionOrders.get(attraction.id);

      // Determine marker color
      let color = "#9ca3af"; // gray for unassigned
      if (isInAnyDay && attractionDayId !== undefined) {
        color = dayColors.get(attractionDayId) ?? "#9ca3af";
      }

      // Determine marker size
      const baseSize = 26;
      const size = isSelected
        ? baseSize + 8
        : isHovered
          ? baseSize + 4
          : baseSize;

      // Increase z-index for selected/hovered markers
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
          // Stop event propagation to prevent triggering other clicks
          L.DomEvent.stopPropagation(e);
          onMarkerClick(attraction);
        });

      markers.set(attraction.id, marker);
      bounds.extend([attraction.latitude, attraction.longitude]);
    });

    // Fit bounds on initial load only
    if (
      hasValidCoordinates &&
      bounds.isValid() &&
      !hasInitializedBounds.current &&
      !selectedDayId &&
      !selectedAttractionId
    ) {
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 12,
      });
      hasInitializedBounds.current = true;
    }
  }, [
    attractions,
    attractionToDayMap,
    selectedDayId,
    dayColors,
    hoveredAttractionId,
    selectedAttractionId,
    selectedDayAttractionOrders,
    onMarkerClick,
  ]);

  return <div ref={containerRef} className="h-full w-full" />;
}
