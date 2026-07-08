"use client";

import { useMemo } from "react";

import { getTrpcErrorMessage } from "~/lib/trpc-error-message";
import { api } from "~/trpc/react";
import type { BasicAttraction, PlanBlock, RouteData } from "~/types";

function getRouteQueryInput(attractions: BasicAttraction[]) {
  const validAttractions = attractions.filter(
    (a) => a.latitude != null && a.longitude != null,
  );

  return {
    points: validAttractions.map((a) => ({
      id: a.id,
      lat: a.latitude!,
      lng: a.longitude!,
    })),
  };
}

function shouldFetchBlockRoute(
  blockId: number,
  points: { id: number; lat: number; lng: number }[],
) {
  return points.length >= 2 && blockId > 0;
}

export function usePlanBlockRouteMap(planBlocks: PlanBlock[]) {
  const blockRouteInputs = useMemo(
    () =>
      planBlocks.map((block) => {
        const { points } = getRouteQueryInput(block.attractions);
        return {
          blockId: block.id,
          points,
          enabled: shouldFetchBlockRoute(block.id, points),
        };
      }),
    [planBlocks],
  );

  const queryResults = api.useQueries((t) =>
    blockRouteInputs.map(({ points, enabled }) =>
      t.route.buildRoute(
        { points },
        {
          enabled,
          refetchOnWindowFocus: false,
          refetchOnMount: false,
          retry: 1,
        },
      ),
    ),
  );

  const blockRoutes = useMemo(() => {
    const map = new Map<number, RouteData>();
    blockRouteInputs.forEach(({ blockId }, i) => {
      const data = queryResults[i]?.data;
      if (data) {
        map.set(blockId, data);
      }
    });
    return map;
  }, [blockRouteInputs, queryResults]);

  const isLoadingRoutes = useMemo(
    () =>
      blockRouteInputs.some(
        (input, i) =>
          input.enabled && (queryResults[i]?.isFetching ?? false),
      ),
    [blockRouteInputs, queryResults],
  );

  return { blockRoutes, isLoadingRoutes };
}

export function usePlanBlockRoute(
  blockId: number,
  attractions: BasicAttraction[],
) {
  const { points } = getRouteQueryInput(attractions);
  const shouldFetch = shouldFetchBlockRoute(blockId, points);

  const {
    data: route,
    isFetching,
    error,
  } = api.route.buildRoute.useQuery(
    { points },
    {
      enabled: shouldFetch,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  );

  return {
    routeData: shouldFetch ? (route ?? null) : null,
    isLoadingRoute: shouldFetch && isFetching,
    routeError:
      shouldFetch && error ? getTrpcErrorMessage(error) : undefined,
  };
}
