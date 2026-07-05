import type { ItineraryDayData, Trip } from "~/types";

export function transformTripDays(trip: Trip): ItineraryDayData[] {
  if (!trip) return [];
  return trip.itineraryDays.map((day) => ({
    id: day.id,
    name: day.name,
    dayNumber: day.dayNumber,
    attractions: day.itineraryDayPlaces
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((place) => place.attraction),
  }));
}
