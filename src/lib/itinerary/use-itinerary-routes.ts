"use client";

import { useMemo } from "react";

import { attractionsToRoutePoints } from "~/lib/itinerary/route-point";
import { getTrpcErrorMessage } from "~/lib/trpc-error-message";
import { api } from "~/trpc/react";
import type {
  ConnectorRouteData,
  LabeledConnectorRoute,
  PlanBlock,
  PlanConnectorLegs,
  RouteData,
} from "~/types";

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

  return useMemo(() => {
    const blockRoutes = new Map<number, RouteData>();
    const blockRouteErrors = new Map<number, string>();
    const planConnectors = new Map<number, PlanConnectorLegs>();
    const stayConnectors = new Map<number, ConnectorRouteData>();
    const labeledRoutes: LabeledConnectorRoute[] = [];

    for (const block of data?.blocks ?? []) {
      if (block.route) blockRoutes.set(block.blockId, block.route);
      if (block.error) blockRouteErrors.set(block.blockId, block.error);
    }

    for (const connector of data?.connectors ?? []) {
      if (!connector.data) continue;

      labeledRoutes.push({ label: connector.label, data: connector.data });

      if (connector.attachTo.type === "plan") {
        const existing = planConnectors.get(connector.attachTo.blockId) ?? {};
        if (connector.attachTo.role === "toHotel") {
          existing.toHotel = connector.data;
        } else {
          existing.fromHotel = connector.data;
        }
        planConnectors.set(connector.attachTo.blockId, existing);
      } else {
        stayConnectors.set(connector.attachTo.stopId, connector.data);
      }
    }

    return {
      blockRoutes,
      blockRouteErrors,
      planConnectors,
      stayConnectors,
      labeledRoutes,
      isLoadingRoutes: isFetching,
      routeError: error ? getTrpcErrorMessage(error) : undefined,
    };
  }, [data, isFetching, error]);
}
