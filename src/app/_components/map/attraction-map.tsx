"use client";

import L, { divIcon } from "leaflet";
import "~/lib/map/leaflet-styles";
import { BuildingIcon } from "lucide-react";
import React, { useEffect, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { api } from "~/trpc/react";
import { normalizePoiName, type NearbyPoi } from "~/lib/geo/nearby-pois";
import type { City } from "~/types";

interface AttractionMapProps {
  latitude: number;
  longitude: number;
  currentCity?: City;
  nearbyPois?: NearbyPoi[];
  selectedPoiName?: string;
  highlightedPoi?: NearbyPoi | null;
  onCoordinatesChange: (lat: number, lng: number) => void;
  onPoiSelect?: (poi: NearbyPoi) => void;
  className?: string;
}

const DEFAULT_ZOOM = 13;
const COORDINATE_THRESHOLD = 0.001;
const SEARCH_RADIUS_DEGREES = 0.3;

const createDivIcon = (IconComponent: React.ElementType, color: string, size: number) => {
  const iconHtml = renderToStaticMarkup(
    <IconComponent
      size={size}
      style={{
        display: "block",
        color: color,
      }}
    />,
  );

  return divIcon({
    html: iconHtml,
    className: "custom-div-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

function createAttractionIcon({ color = "#ff4d4f", size = 40, pulse = true }) {
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
    <path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z' fill='${color}' />
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

const CURRENT_CITY_MARKER_ICON = createDivIcon(BuildingIcon, "blue", 32);
const NEAREST_CITY_MARKER_ICON = createDivIcon(BuildingIcon, "green", 32);
const ATTRACTION_MARKER_ICON = createAttractionIcon({});
const POI_MARKER_ICON = createAttractionIcon({ color: "#6366f1", size: 28, pulse: false });
const POI_SELECTED_MARKER_ICON = createAttractionIcon({
  color: "#f97316",
  size: 28,
  pulse: false,
});

const POI_HOVERED_MARKER_ICON = createAttractionIcon({
  color: "#8b5cf6",
  size: 36,
  pulse: true,
});

function poiMatches(a: NearbyPoi, b: NearbyPoi | null | undefined): boolean {
  if (!b) return false;
  return (
    a.normalizedName === b.normalizedName &&
    a.latitude === b.latitude &&
    a.longitude === b.longitude
  );
}

export function AttractionMap({
  latitude,
  longitude,
  currentCity,
  nearbyPois = [],
  selectedPoiName = "",
  highlightedPoi = null,
  onCoordinatesChange,
  onPoiSelect,
  className,
}: AttractionMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const attractionMarkerRef = useRef<L.Marker | null>(null);
  const cityMarkersRef = useRef<L.Marker[]>([]);
  const poiMarkersRef = useRef<L.Marker[]>([]);
  const onCoordinatesChangeRef = useRef(onCoordinatesChange);
  const onPoiSelectRef = useRef(onPoiSelect);
  const prevCoordsRef = useRef({ lat: latitude, lng: longitude });
  const initialCoordsRef = useRef({ lat: latitude, lng: longitude });
  onCoordinatesChangeRef.current = onCoordinatesChange;
  onPoiSelectRef.current = onPoiSelect;

  const {
    data: nearbyCities,
    error,
    isLoading,
  } = api.geo.getNearestCities.useQuery({
    latitude,
    longitude,
    searchRadiusDegrees: SEARCH_RADIUS_DEGREES,
  });

  const { data: extendedNearbyCities, isLoading: loadingExtended } =
    api.geo.getNearestCities.useQuery(
      {
        latitude,
        longitude,
        searchRadiusDegrees: SEARCH_RADIUS_DEGREES * 9,
      },
      { enabled: !error && !isLoading && nearbyCities?.length === 0 },
    );

  const cities = (
    nearbyCities?.length ? nearbyCities : (extendedNearbyCities ?? [])
  ).filter((city) => city.id !== currentCity?.id);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [initialCoordsRef.current.lat, initialCoordsRef.current.lng],
      zoom: DEFAULT_ZOOM,
      scrollWheelZoom: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (e) => {
      onCoordinatesChangeRef.current(e.latlng.lat, e.latlng.lng);
    });

    const marker = L.marker(
      [initialCoordsRef.current.lat, initialCoordsRef.current.lng],
      {
        icon: ATTRACTION_MARKER_ICON,
        draggable: true,
      },
    ).addTo(map);

    marker.on("dragend", () => {
      const latLng = marker.getLatLng();
      onCoordinatesChangeRef.current(latLng.lat, latLng.lng);
    });

    mapRef.current = map;
    attractionMarkerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      attractionMarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = attractionMarkerRef.current;
    if (!map || !marker) return;

    marker.setLatLng([latitude, longitude]);

    const latDiff = Math.abs(latitude - prevCoordsRef.current.lat);
    const lngDiff = Math.abs(longitude - prevCoordsRef.current.lng);
    if (latDiff > COORDINATE_THRESHOLD || lngDiff > COORDINATE_THRESHOLD) {
      map.setView([latitude, longitude], map.getZoom(), { animate: true, duration: 0.5 });
      prevCoordsRef.current = { lat: latitude, lng: longitude };
    }
  }, [latitude, longitude]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const marker of cityMarkersRef.current) {
      marker.remove();
    }
    cityMarkersRef.current = [];

    if (currentCity) {
      const marker = L.marker([currentCity.latitude, currentCity.longitude], {
        icon: CURRENT_CITY_MARKER_ICON,
      }).addTo(map);
      marker.bindTooltip(`Current City: ${currentCity.name}`);
      cityMarkersRef.current.push(marker);
    }

    for (const city of cities) {
      const marker = L.marker([city.latitude, city.longitude], {
        icon: NEAREST_CITY_MARKER_ICON,
      }).addTo(map);
      marker.bindTooltip(city.name);
      marker.bindPopup(city.name);
      cityMarkersRef.current.push(marker);
    }
  }, [currentCity, cities]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const marker of poiMarkersRef.current) {
      marker.remove();
    }
    poiMarkersRef.current = [];

    const normalizedSelected = normalizePoiName(selectedPoiName);

    for (const poi of nearbyPois) {
      const isSelected = normalizedSelected === poi.normalizedName;
      const isHovered = poiMatches(poi, highlightedPoi);
      const marker = L.marker([poi.latitude, poi.longitude], {
        icon: isSelected
          ? POI_SELECTED_MARKER_ICON
          : isHovered
            ? POI_HOVERED_MARKER_ICON
            : POI_MARKER_ICON,
        zIndexOffset: isSelected || isHovered ? 1000 : 0,
      }).addTo(map);

      marker.bindTooltip(poi.name);
      marker.bindPopup(
        `<strong>${poi.name}</strong><br/>${poi.distanceMeters}m · ${poi.source}`,
      );

      if (isHovered) {
        marker.openTooltip();
      }

      marker.on("click", (event) => {
        L.DomEvent.stopPropagation(event);
        onPoiSelectRef.current?.(poi);
      });

      poiMarkersRef.current.push(marker);
    }
  }, [nearbyPois, selectedPoiName, highlightedPoi]);

  return (
    <div className={className}>
      {error && (
        <div className="mb-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">
            Failed to load nearby cities. The map will still function normally.
          </p>
        </div>
      )}

      {(isLoading || loadingExtended) && (
        <div className="mb-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm text-blue-800">Loading nearby cities...</p>
        </div>
      )}

      <div
        ref={containerRef}
        className="h-full w-full rounded-lg border border-gray-200 bg-gray-100"
      />
    </div>
  );
}
