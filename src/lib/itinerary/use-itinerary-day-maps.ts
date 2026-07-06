import { useMemo } from "react";

import { getItineraryDayColor } from "~/lib/map/colors";
import type { BasicAttraction, ItineraryDayData } from "~/types";

export function useItineraryDayMaps(itineraryDays: ItineraryDayData[]) {
  const allDaysAttractions = useMemo(() => {
    const map = new Map<number, BasicAttraction[]>();
    itineraryDays.forEach((day) => map.set(day.id, day.attractions));
    return map;
  }, [itineraryDays]);

  const dayColors = useMemo(() => {
    const map = new Map<number, string>();
    itineraryDays.forEach((day, index) =>
      map.set(day.id, getItineraryDayColor(index)),
    );
    return map;
  }, [itineraryDays]);

  const attractionToDayMap = useMemo(() => {
    const map = new Map<number, ItineraryDayData>();
    itineraryDays.forEach((day) => {
      day.attractions.forEach((attraction) => map.set(attraction.id, day));
    });
    return map;
  }, [itineraryDays]);

  return { allDaysAttractions, dayColors, attractionToDayMap };
}
