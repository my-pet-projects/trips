"use client";

import { AlertTriangle, Loader2, MapPin, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { normalizePoiName, type NearbyPoi } from "~/lib/geo/nearby-pois";
import { getTrpcErrorMessage } from "~/lib/trpc-error-message";
import { api } from "~/trpc/react";

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

function PoiErrorBanner({
  message,
  onRetry,
  isRetrying,
}: {
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <div
      className="mt-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-2"
      role="alert"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-red-800">
            Failed to load nearby places
          </p>
          <p className="mt-0.5 break-words text-xs text-red-700">{message}</p>
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="mt-1.5 inline-flex items-center gap-1 rounded border border-red-300 bg-white px-2 py-0.5 text-xs font-medium text-red-800 hover:bg-red-100 disabled:opacity-60"
          >
            {isRetrying ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Retrying…
              </>
            ) : (
              <>
                <RotateCw className="h-3 w-3" />
                Retry
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

type NearbyPoiSuggestionsProps = {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  countryCode?: string;
  selectedName: string;
  onSelect: (poi: NearbyPoi) => void;
  onHover?: (poi: NearbyPoi | null) => void;
  onPoisChange?: (pois: NearbyPoi[]) => void;
  onPoisError?: (message: string | null) => void;
};

export function NearbyPoiSuggestions({
  latitude,
  longitude,
  countryCode,
  selectedName,
  onSelect,
  onHover,
  onPoisChange,
  onPoisError,
}: NearbyPoiSuggestionsProps) {
  const hasCoordinates =
    Number.isFinite(latitude ?? NaN) && Number.isFinite(longitude ?? NaN);

  const [debouncedCoords, setDebouncedCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    if (!hasCoordinates) {
      setDebouncedCoords(null);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedCoords({
        latitude: latitude as number,
        longitude: longitude as number,
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [hasCoordinates, latitude, longitude]);

  const nearbyPoisQuery = api.geo.getNearbyPois.useQuery(
    {
      latitude: debouncedCoords?.latitude ?? 0,
      longitude: debouncedCoords?.longitude ?? 0,
      radiusMeters: 250,
      countryCode: countryCode?.length === 2 ? countryCode.toUpperCase() : undefined,
    },
    {
      enabled: debouncedCoords != null,
      staleTime: 60_000,
    },
  );

  const errorMessage = nearbyPoisQuery.isError
    ? getTrpcErrorMessage(nearbyPoisQuery.error)
    : null;

  const pois = nearbyPoisQuery.isError ? [] : (nearbyPoisQuery.data ?? []);

  useEffect(() => {
    if (!hasCoordinates || nearbyPoisQuery.isError) {
      onPoisChange?.([]);
      return;
    }

    if (nearbyPoisQuery.data) {
      onPoisChange?.(nearbyPoisQuery.data);
    }
  }, [
    hasCoordinates,
    nearbyPoisQuery.data,
    nearbyPoisQuery.isError,
    onPoisChange,
  ]);

  useEffect(() => {
    onPoisError?.(errorMessage);
  }, [errorMessage, onPoisError]);

  useEffect(() => {
    if (!errorMessage) return;

    toast.error("Failed to load nearby places", {
      id: "nearby-pois-error",
      description: errorMessage,
    });
  }, [errorMessage]);

  if (!hasCoordinates) {
    return (
      <p className="mt-1.5 text-xs text-gray-500">
        Set map coordinates to see nearby place names.
      </p>
    );
  }

  if (
    nearbyPoisQuery.isLoading ||
    (nearbyPoisQuery.isFetching && !nearbyPoisQuery.data && !errorMessage)
  ) {
    return (
      <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Looking up nearby places…
      </div>
    );
  }

  if (errorMessage) {
    return (
      <PoiErrorBanner
        message={errorMessage}
        onRetry={() => void nearbyPoisQuery.refetch()}
        isRetrying={nearbyPoisQuery.isFetching}
      />
    );
  }

  if (pois.length === 0) {
    return (
      <p className="mt-1.5 text-xs text-gray-500">
        No named places found within 250m.
      </p>
    );
  }

  const normalizedSelected = normalizePoiName(selectedName);

  return (
    <div className="mt-1.5">
      <p className="text-xs font-medium text-gray-600">Nearby places</p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {pois.map((poi) => {
          const isSelected =
            normalizedSelected.length > 0 &&
            normalizedSelected === poi.normalizedName;

          return (
            <button
              key={`${poi.source}-${poi.name}-${poi.latitude}-${poi.longitude}`}
              type="button"
              onClick={() => onSelect(poi)}
              onMouseEnter={() => onHover?.(poi)}
              onMouseLeave={() => onHover?.(null)}
              onFocus={() => onHover?.(poi)}
              onBlur={() => onHover?.(null)}
              className={`inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-left text-xs transition-colors ${
                isSelected
                  ? "border-orange-400 bg-orange-50 text-orange-800"
                  : "border-gray-200 bg-gray-50 text-gray-700 hover:border-orange-300 hover:bg-orange-50/60"
              }`}
              title={`Use "${poi.name}" as local name (${poi.source})`}
            >
              <MapPin className="h-3 w-3 shrink-0 opacity-60" />
              <span className="truncate">{poi.name}</span>
              <span className="shrink-0 text-[10px] text-gray-500">
                {formatDistance(poi.distanceMeters)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
