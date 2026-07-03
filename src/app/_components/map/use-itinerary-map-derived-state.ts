import { useMemo } from "react";

import type { AttractionDetail, BasicAttraction } from "~/types";

import type { AttractionMapStatus } from "./attraction-map-shell";

export function useItineraryMapDerivedState(
  allDaysAttractions: Map<number, BasicAttraction[]>,
  selectedDayAttractions: BasicAttraction[],
  selectedDayId: number | null,
) {
  const attractionToDayMap = useMemo(() => {
    const map = new Map<number, number>();
    allDaysAttractions.forEach((dayAttractions, dayId) => {
      dayAttractions.forEach((attraction) => {
        map.set(attraction.id, dayId);
      });
    });
    return map;
  }, [allDaysAttractions]);

  const selectedDayAttractionOrders = useMemo(() => {
    const map = new Map<number, number>();
    selectedDayAttractions.forEach((attr, index) => {
      map.set(attr.id, index + 1);
    });
    return map;
  }, [selectedDayAttractions]);

  const resolveAttractionStatus = useMemo(
    (): ((attraction: AttractionDetail) => AttractionMapStatus) =>
      (attraction) => {
        const dayId = attractionToDayMap.get(attraction.id);
        return {
          dayId,
          isInAnyDay: dayId !== undefined,
          isInSelectedDay: dayId === selectedDayId,
        };
      },
    [attractionToDayMap, selectedDayId],
  );

  return { attractionToDayMap, selectedDayAttractionOrders, resolveAttractionStatus };
}
