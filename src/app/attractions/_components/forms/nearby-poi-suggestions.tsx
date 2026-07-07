"use client";

import { AlertTriangle, MapPin, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "~/app/_components/ui/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "~/app/_components/ui/alert";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "~/app/_components/ui/empty";
import { Spinner } from "~/app/_components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/app/_components/ui/tooltip";
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
    <Alert
      variant="destructive"
      className="mt-1.5 border-red-200 bg-red-50 px-2.5 py-2 [&>svg]:text-red-600"
    >
      <AlertTriangle />
      <AlertTitle className="text-xs text-red-800">
        Failed to load nearby places
      </AlertTitle>
      <AlertDescription className="text-xs text-red-700">{message}</AlertDescription>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-1.5 h-7 border-red-300 text-xs text-red-800 hover:bg-red-100"
        onClick={onRetry}
        disabled={isRetrying}
      >
        {isRetrying ? (
          <>
            <Spinner className="h-3 w-3" />
            Retrying…
          </>
        ) : (
          <>
            <RotateCw className="h-3 w-3" />
            Retry
          </>
        )}
      </Button>
    </Alert>
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
        <Spinner className="h-3.5 w-3.5" />
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
      <Empty className="mt-1.5 border-dashed border-gray-200 bg-gray-50 px-4 py-6">
        <EmptyHeader>
          <EmptyTitle className="text-sm">No nearby places found</EmptyTitle>
          <EmptyDescription className="text-xs">
            No named places were found within 250m of these coordinates.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
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
            <Tooltip key={`${poi.source}-${poi.name}-${poi.latitude}-${poi.longitude}`}>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`h-auto max-w-full gap-1.5 px-2 py-1 text-left text-xs ${
                      isSelected
                        ? "border-orange-400 bg-orange-50 text-orange-800 hover:bg-orange-50"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:border-orange-300 hover:bg-orange-50/60"
                    }`}
                    onClick={() => onSelect(poi)}
                    onMouseEnter={() => onHover?.(poi)}
                    onMouseLeave={() => onHover?.(null)}
                    onFocus={() => onHover?.(poi)}
                    onBlur={() => onHover?.(null)}
                  />
                }
              >
                <MapPin className="h-3 w-3 shrink-0 opacity-60" />
                <span className="truncate">{poi.name}</span>
                <span className="shrink-0 text-[10px] text-gray-500">
                  {formatDistance(poi.distanceMeters)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                Use &ldquo;{poi.name}&rdquo; as local name ({poi.source})
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
