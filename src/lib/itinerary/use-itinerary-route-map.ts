"use client";

import { useMemo } from "react";

import { getTrpcErrorMessage } from "~/lib/trpc-error-message";
import { api } from "~/trpc/react";
import type { BasicAttraction, ItineraryDayData, RouteData } from "~/types";

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

function shouldFetchDayRoute(
  dayId: number,
  points: { id: number; lat: number; lng: number }[],
) {
  return points.length >= 2 && dayId > 0;
}

export function useItineraryRouteMap(days: ItineraryDayData[]) {
  const dayRouteInputs = useMemo(
    () =>
      days.map((day) => {
        const { points } = getRouteQueryInput(day.attractions);
        return {
          dayId: day.id,
          points,
          enabled: shouldFetchDayRoute(day.id, points),
        };
      }),
    [days],
  );

  const queryResults = api.useQueries((t) =>
    dayRouteInputs.map(({ points, enabled }) =>
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

  const dayRoutes = useMemo(() => {
    const map = new Map<number, RouteData>();
    dayRouteInputs.forEach(({ dayId }, i) => {
      const data = queryResults[i]?.data;
      if (data) {
        map.set(dayId, data);
      }
    });
    return map;
  }, [dayRouteInputs, queryResults]);

  const isLoadingRoutes = useMemo(
    () =>
      dayRouteInputs.some(
        (input, i) =>
          input.enabled && (queryResults[i]?.isFetching ?? false),
      ),
    [dayRouteInputs, queryResults],
  );

  return { dayRoutes, isLoadingRoutes };
}

export function useDayRoute(dayId: number, attractions: BasicAttraction[]) {
  const { points } = getRouteQueryInput(attractions);
  const shouldFetch = shouldFetchDayRoute(dayId, points);

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
