import L from "leaflet";
import { useCallback, useEffect, useRef, useState } from "react";

const USER_LOCATION_ZOOM = 16;

const createCurrentLocationMarkerIcon = (size: number) => {
  const innerDotSize = Math.max(6, size / 3);
  const blueDotSize = size;
  const pulseRingBaseSize = size + 8;

  return `
      <div style="
        position: relative;
        width: ${pulseRingBaseSize}px;
        height: ${pulseRingBaseSize}px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <!-- The stable, always-visible blue dot -->
        <div style="
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          width: ${blueDotSize}px;
          height: ${blueDotSize}px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            background-color: white;
            width: ${innerDotSize}px;
            height: ${innerDotSize}px;
            border-radius: 50%;
          "></div>
        </div>
        <!-- The pulsating, fading outer ring -->
        <div class="current-location-pulse-ring" style="
          background-color: rgba(59, 130, 246, 0.6);
          width: ${pulseRingBaseSize}px;
          height: ${pulseRingBaseSize}px;
          border-radius: 50%;
          position: absolute;
        "></div>
      </div>
    `;
};

const GEOLOCATION_MARKER_STYLES = `
  /* Keyframes for the pulsing ring animation */
  @keyframes pulse-location-ring {
    0% {
      transform: scale(0.6);
      opacity: 0.8;
    }
    100% {
      transform: scale(1.4);
      opacity: 0;
    }
  }

  /* Style for the pulsating outer ring element */
  .current-location-pulse-ring {
    animation: pulse-location-ring 2s ease-out infinite;
  }
`;

export const useGeolocationTracking = (
  mapRef: React.RefObject<L.Map | null>,
  enableTracking: boolean,
) => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const currentLocationMarkerRef = useRef<L.Marker | null>(null);

  // Effect to inject styles for the geolocation marker
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.id = "geolocation-marker-styles";
    styleElement.textContent = GEOLOCATION_MARKER_STYLES;
    document.head.appendChild(styleElement);

    // Clean up the style element when the component unmounts
    return () => {
      const existingStyle = document.getElementById(
        "geolocation-marker-styles",
      );
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !isTrackingLocation || !enableTracking) {
      if (
        !isTrackingLocation &&
        currentLocationMarkerRef.current &&
        mapRef.current
      ) {
        currentLocationMarkerRef.current.remove();
        currentLocationMarkerRef.current = null;
        setUserLocation(null);
      }
      return;
    }

    const map = mapRef.current;
    let watchId: number | null = null;

    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation: [number, number] = [latitude, longitude];
          setUserLocation(newLocation);

          const blueDotMarkerSize = 24;
          const iconContainerSize = blueDotMarkerSize + 8;
          const iconAnchorPoint = iconContainerSize / 2;

          if (currentLocationMarkerRef.current) {
            currentLocationMarkerRef.current.setLatLng(newLocation);
          } else {
            const icon = L.divIcon({
              html: createCurrentLocationMarkerIcon(blueDotMarkerSize),
              className: "current-location-marker-container",
              iconSize: [iconContainerSize, iconContainerSize],
              iconAnchor: [iconAnchorPoint, iconAnchorPoint],
            });

            currentLocationMarkerRef.current = L.marker(newLocation, {
              icon,
              zIndexOffset: 1500,
            }).addTo(map);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsTrackingLocation(false);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000,
        },
      );
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (currentLocationMarkerRef.current) {
        currentLocationMarkerRef.current.remove();
        currentLocationMarkerRef.current = null;
      }
    };
  }, [isTrackingLocation, enableTracking, mapRef]);

  const toggleLocationTracking = useCallback(() => {
    setIsTrackingLocation((prev) => !prev);
  }, []);

  const centerOnUserLocation = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.setView(userLocation, USER_LOCATION_ZOOM, {
        animate: true,
      });
    }
  }, [userLocation, mapRef]);

  return {
    userLocation,
    isTrackingLocation,
    toggleLocationTracking,
    centerOnUserLocation,
  };
};
