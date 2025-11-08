import L, { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { BuildingIcon } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";

import { api, type RouterOutputs } from "~/trpc/react";

type City = RouterOutputs["geo"]["getCitiesByCountry"][number];

interface AttractionMapProps {
  latitude: number;
  longitude: number;
  currentCity: City;
  onCoordinatesChange: (lat: number, lng: number) => void;
  className?: string;
}

interface MapControllerProps extends AttractionMapProps {
  nearestCities?: City[];
}

// Constants
const DEFAULT_ZOOM = 13;
const COORDINATE_THRESHOLD = 0.001;
const SEARCH_RADIUS_DEGREES = 0.3;

// Memoized icon creators (moved outside component to prevent recreation)
const createDivIcon = (
  IconComponent: React.ElementType,
  color: string,
  size: number,
) => {
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

// Create icons once
const CUSTOM_MARKER_ICON = createDivIcon(BuildingIcon, "blue", 32);
const NEAREST_MARKER_ICON = createDivIcon(BuildingIcon, "green", 32);
const ATTRACTION_MARKER_ICON = createAttractionIcon({});

function MapController({
  latitude,
  longitude,
  currentCity,
  nearestCities,
  onCoordinatesChange,
}: MapControllerProps) {
  const map = useMap();
  const markerRef = useRef<L.Marker>(null);
  const prevCoordsRef = useRef({ lat: latitude, lng: longitude });

  useEffect(() => {
    const latDiff = Math.abs(latitude - prevCoordsRef.current.lat);
    const lngDiff = Math.abs(longitude - prevCoordsRef.current.lng);

    // Only update view if coordinates changed significantly
    if (latDiff > COORDINATE_THRESHOLD || lngDiff > COORDINATE_THRESHOLD) {
      const currentZoom = map.getZoom();

      map.setView([latitude, longitude], currentZoom, {
        animate: true,
        duration: 0.5,
      });

      prevCoordsRef.current = { lat: latitude, lng: longitude };
    }
  }, [latitude, longitude, map]);

  const handleMapClick = useCallback(
    (e: L.LeafletMouseEvent) => {
      onCoordinatesChange(e.latlng.lat, e.latlng.lng);
    },
    [onCoordinatesChange],
  );

  // Marker drag handler
  const markerEventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          onCoordinatesChange(latLng.lat, latLng.lng);
        }
      },
    }),
    [onCoordinatesChange],
  );

  // Handle map clicks
  useMapEvents({
    click: handleMapClick,
  });

  return (
    <>
      <Marker
        draggable={true}
        eventHandlers={markerEventHandlers}
        position={[latitude, longitude]}
        ref={markerRef}
        icon={ATTRACTION_MARKER_ICON}
      />

      <Marker
        draggable={false}
        position={[currentCity.latitude, currentCity.longitude]}
        icon={CUSTOM_MARKER_ICON}
      >
        <Tooltip>
          <span>Current City: {currentCity.name}</span>
        </Tooltip>
      </Marker>

      {nearestCities?.map((city) => (
        <Marker
          key={city.id}
          position={[city.latitude, city.longitude]}
          icon={NEAREST_MARKER_ICON}
        >
          <Tooltip>
            <span className="text-sm font-medium text-gray-900">
              {city.name}
            </span>
          </Tooltip>
          <Popup>
            <span className="text-sm font-medium text-gray-900">
              {city.name}
            </span>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

export function AttractionMap({
  latitude,
  longitude,
  currentCity,
  onCoordinatesChange,
  className,
}: AttractionMapProps) {
  const initialCenter: [number, number] = [latitude, longitude];

  const {
    data: nearestCities,
    error,
    isLoading,
  } = api.geo.getNearestCities.useQuery({
    latitude: currentCity.latitude,
    longitude: currentCity.longitude,
    searchRadiusDegrees: SEARCH_RADIUS_DEGREES,
  });

  return (
    <div className={className}>
      {error && (
        <div className="mb-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">
            Failed to load nearby cities. The map will still function normally.
          </p>
        </div>
      )}

      {isLoading && (
        <div className="mb-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm text-blue-800">Loading nearby cities...</p>
        </div>
      )}

      <MapContainer
        center={initialCenter}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
        className="rounded-lg border border-gray-200 bg-gray-100"
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapController
          latitude={latitude}
          longitude={longitude}
          currentCity={currentCity}
          nearestCities={nearestCities}
          onCoordinatesChange={onCoordinatesChange}
        />
      </MapContainer>
    </div>
  );
}
