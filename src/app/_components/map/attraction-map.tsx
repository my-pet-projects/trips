"use client";

import L from "leaflet";
import "~/lib/map/leaflet-styles";
import { AlertCircle, BuildingIcon } from "lucide-react";
import { useEffect, useRef } from "react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "~/app/_components/ui/alert";
import { Spinner } from "~/app/_components/ui/spinner";
import { api } from "~/trpc/react";
import { normalizePoiName, type NearbyPoi } from "~/lib/geo/nearby-pois";
import {
  createAttractionIcon,
  createDivIcon,
} from "~/lib/map/marker-icons/attraction";
import { bindMarkerTooltip } from "~/lib/map/marker-tooltip";
import type { City } from "~/types";

import { useLeafletMap } from "./use-leaflet-map";

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

const CURRENT_CITY_MARKER_ICON = createDivIcon(BuildingIcon, "blue", 32);
const NEAREST_CITY_MARKER_ICON = createDivIcon(BuildingIcon, "green", 32);
const ATTRACTION_MARKER_ICON = createAttractionIcon({});
const POI_MARKER_ICON = createAttractionIcon({
  color: "#6366f1",
  size: 28,
  pulse: false,
});
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
  const attractionMarkerRef = useRef<L.Marker | null>(null);
  const cityMarkersRef = useRef<L.Marker[]>([]);
  const poiMarkersRef = useRef<L.Marker[]>([]);
  const onCoordinatesChangeRef = useRef(onCoordinatesChange);
  const onPoiSelectRef = useRef(onPoiSelect);
  const prevCoordsRef = useRef({ lat: latitude, lng: longitude });
  const initialCoordsRef = useRef({ lat: latitude, lng: longitude });
  onCoordinatesChangeRef.current = onCoordinatesChange;
  onPoiSelectRef.current = onPoiSelect;

  const { mapRef, mapReady } = useLeafletMap(containerRef, [], {
    center: [initialCoordsRef.current.lat, initialCoordsRef.current.lng],
    zoom: DEFAULT_ZOOM,
    attributionControl: false,
  });

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
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      onCoordinatesChangeRef.current(e.latlng.lat, e.latlng.lng);
    };
    map.on("click", handleClick);

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

    attractionMarkerRef.current = marker;

    return () => {
      map.off("click", handleClick);
      marker.remove();
      attractionMarkerRef.current = null;
    };
  }, [mapRef, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = attractionMarkerRef.current;
    if (!map || !marker) return;

    marker.setLatLng([latitude, longitude]);

    const latDiff = Math.abs(latitude - prevCoordsRef.current.lat);
    const lngDiff = Math.abs(longitude - prevCoordsRef.current.lng);
    if (latDiff > COORDINATE_THRESHOLD || lngDiff > COORDINATE_THRESHOLD) {
      map.setView([latitude, longitude], map.getZoom(), {
        animate: true,
        duration: 0.5,
      });
      prevCoordsRef.current = { lat: latitude, lng: longitude };
    }
  }, [latitude, longitude, mapReady, mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    for (const marker of cityMarkersRef.current) {
      marker.remove();
    }
    cityMarkersRef.current = [];

    if (currentCity) {
      const marker = L.marker([currentCity.latitude, currentCity.longitude], {
        icon: CURRENT_CITY_MARKER_ICON,
      }).addTo(map);
      bindMarkerTooltip(marker, `Current City: ${currentCity.name}`);
      cityMarkersRef.current.push(marker);
    }

    for (const city of cities) {
      const marker = L.marker([city.latitude, city.longitude], {
        icon: NEAREST_CITY_MARKER_ICON,
      }).addTo(map);
      bindMarkerTooltip(marker, city.name);
      marker.bindPopup(city.name);
      cityMarkersRef.current.push(marker);
    }
  }, [currentCity, cities, mapReady, mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

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

      bindMarkerTooltip(marker, poi.name);
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
  }, [nearbyPois, selectedPoiName, highlightedPoi, mapReady, mapRef]);

  return (
    <div className={className}>
      {error && (
        <Alert
          variant="destructive"
          className="mb-2 border-red-200 bg-red-50 [&>svg]:text-red-600"
        >
          <AlertCircle />
          <AlertTitle className="text-red-900">Map warning</AlertTitle>
          <AlertDescription className="text-red-800">
            Failed to load nearby cities. The map will still function normally.
          </AlertDescription>
        </Alert>
      )}

      {(isLoading || loadingExtended) && (
        <Alert className="mb-2 border-blue-200 bg-blue-50 [&>svg]:text-blue-600">
          <Spinner className="size-4 text-blue-600" />
          <AlertTitle className="text-blue-900">
            Loading nearby cities
          </AlertTitle>
          <AlertDescription className="text-blue-800">
            Fetching map data…
          </AlertDescription>
        </Alert>
      )}

      <div
        ref={containerRef}
        className="h-full w-full rounded-lg border border-gray-200 bg-gray-100"
      />
    </div>
  );
}
