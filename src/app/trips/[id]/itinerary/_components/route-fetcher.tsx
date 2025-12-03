"use client";

import { useEffect } from "react";

import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";

type Trip = RouterOutputs["trip"]["getWithItinerary"];
type BasicAttraction =
  Trip["itineraryDays"][number]["itineraryDayPlaces"][number]["attraction"];
type RouteData = RouterOutputs["route"]["buildRoute"];

export function useDayRouteFetch(
  dayId: number,
  attractions: BasicAttraction[],
  onUpdate: (
    dayId: number,
    route: RouteData | null,
    isLoading: boolean,
    error?: Error,
  ) => void,
) {
  const validAttractions = attractions.filter(
    (a) => a.latitude != null && a.longitude != null,
  );

  const shouldFetch = validAttractions.length >= 2;

  const {
    data: route,
    isFetching,
    error,
  } = api.route.buildRoute.useQuery(
    {
      points: validAttractions.map((a) => ({
        id: a.id,
        lat: a.latitude!,
        lng: a.longitude!,
      })),
    },
    {
      enabled: shouldFetch,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  );

  useEffect(() => {
    if (shouldFetch) {
      onUpdate(
        dayId,
        route ?? null,
        isFetching,
        error ? new Error(error.message) : undefined,
      );
    } else {
      onUpdate(dayId, null, false);
    }
  }, [route, isFetching, error, shouldFetch, dayId, onUpdate]);
}

function DayRouteFetcherItem({
  dayId,
  attractions,
  onUpdate,
}: {
  dayId: number;
  attractions: BasicAttraction[];
  onUpdate: (
    dayId: number,
    route: RouteData | null,
    isLoading: boolean,
  ) => void;
}) {
  useDayRouteFetch(dayId, attractions, onUpdate);
  return null;
}

export function DayRoutesFetcher({
  itineraryDays,
  onUpdate,
}: {
  itineraryDays: Array<{
    id: number;
    attractions: BasicAttraction[];
  }>;
  onUpdate: (
    dayId: number,
    route: RouteData | null,
    isLoading: boolean,
  ) => void;
}) {
  return (
    <>
      {itineraryDays.map((day) => (
        <DayRouteFetcherItem
          key={day.id}
          dayId={day.id}
          attractions={day.attractions}
          onUpdate={onUpdate}
        />
      ))}
    </>
  );
}
