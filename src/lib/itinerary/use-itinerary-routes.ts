"use client";

import { useMemo } from "react";

import { attractionsToRoutePoints } from "~/lib/itinerary/route-point";
import { getTrpcErrorMessage } from "~/lib/trpc-error-message";
import { api } from "~/trpc/react";
import type { OvernightLegResult, PlanBlock, RouteData } from "~/types";

export const ROUTE_QUERY_OPTIONS = {
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  retry: 1,
  staleTime: 5 * 60 * 1000,
} as const;

export function shouldFetchBlockRoute(
  blockId: number,
  attractions: PlanBlock["attractions"],
) {
  return blockId > 0 && attractionsToRoutePoints(attractions).length >= 2;
}

export function useItineraryRoutes(tripId: number) {
  const { data, isFetching, error } = api.route.forTrip.useQuery(
    { tripId },
    ROUTE_QUERY_OPTIONS,
  );

  const blockRoutes = useMemo(() => {
    const map = new Map<number, RouteData>();
    for (const block of data?.blocks ?? []) {
      if (block.route) map.set(block.blockId, block.route);
    }
    return map;
  }, [data]);

  const blockRouteErrors = useMemo(() => {
    const map = new Map<number, string>();
    for (const block of data?.blocks ?? []) {
      if (block.error) map.set(block.blockId, block.error);
    }
    return map;
  }, [data]);

  const overnightLegs = useMemo(() => {
    const map = new Map<number, OvernightLegResult>();
    for (const leg of data?.overnight ?? []) {
      const existing = map.get(leg.blockId) ?? {};
      if (leg.kind === "departure") {
        existing.departure = {
          stopId: leg.stopId,
          toAttractionId: leg.attractionId,
          data: leg.data,
        };
      } else {
        existing.arrival = {
          stopId: leg.stopId,
          fromAttractionId: leg.attractionId,
          data: leg.data,
        };
      }
      map.set(leg.blockId, existing);
    }
    return map;
  }, [data]);

  return {
    blockRoutes,
    blockRouteErrors,
    overnightLegs,
    isLoadingRoutes: isFetching,
    routeError: error ? getTrpcErrorMessage(error) : undefined,
  };
}
