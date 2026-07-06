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
  const queryResults = api.useQueries((t) =>
    days.map((day) => {
      const { points } = getRouteQueryInput(day.attractions);
      return t.route.buildRoute(
        { points },
        {
          enabled: shouldFetchDayRoute(day.id, points),
          refetchOnWindowFocus: false,
          refetchOnMount: false,
          retry: 1,
        },
      );
    }),
  );

  const dayRoutes = useMemo(() => {
    const map = new Map<number, RouteData>();
    days.forEach((day, i) => {
      const data = queryResults[i]?.data;
      if (data) {
        map.set(day.id, data);
      }
    });
    return map;
  }, [days, queryResults]);

  const isLoadingRoutes = useMemo(
    () =>
      days.some((day, i) => {
        const { points } = getRouteQueryInput(day.attractions);
        return (
          shouldFetchDayRoute(day.id, points) &&
          (queryResults[i]?.isFetching ?? false)
        );
      }),
    [days, queryResults],
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
