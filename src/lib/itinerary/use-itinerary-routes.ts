import { useCallback, useMemo, useState } from "react";

import type { RouteData } from "~/types";

export function useItineraryRoutes() {
  const [dayRoutes, setDayRoutes] = useState<Map<number, RouteData>>(
    () => new Map(),
  );
  const [loadingRoutes, setLoadingRoutes] = useState<Map<number, boolean>>(
    () => new Map(),
  );
  const [routeErrors, setRouteErrors] = useState<Map<number, string>>(
    () => new Map(),
  );

  const isLoadingRoutes = useMemo(
    () => [...loadingRoutes.values()].some(Boolean),
    [loadingRoutes],
  );

  const updateRoute = useCallback(
    (
      dayId: number,
      route: RouteData | null,
      isLoading: boolean,
      errorMessage?: string,
    ) => {
      setRouteErrors((prev) => {
        const newMap = new Map(prev);
        if (errorMessage) {
          newMap.set(dayId, errorMessage);
        } else {
          newMap.delete(dayId);
        }
        return newMap;
      });

      setLoadingRoutes((prev) => {
        const newMap = new Map(prev);
        newMap.set(dayId, isLoading);
        return newMap;
      });

      setDayRoutes((prev) => {
        const newMap = new Map(prev);
        if (route) {
          newMap.set(dayId, route);
        } else if (!isLoading) {
          newMap.delete(dayId);
        }
        return newMap;
      });
    },
    [],
  );

  const clearRoute = useCallback((dayId: number) => {
    setDayRoutes((prev) => {
      const newMap = new Map(prev);
      newMap.delete(dayId);
      return newMap;
    });
    setLoadingRoutes((prev) => {
      const newMap = new Map(prev);
      newMap.delete(dayId);
      return newMap;
    });
    setRouteErrors((prev) => {
      const newMap = new Map(prev);
      newMap.delete(dayId);
      return newMap;
    });
  }, []);

  return {
    dayRoutes,
    loadingRoutes,
    routeErrors,
    isLoadingRoutes,
    updateRoute,
    clearRoute,
  };
}
