/**
 * Shared type definitions derived from tRPC router outputs.
 * These types provide a single source of truth for commonly used entities.
 */
import type { RouterOutputs } from "~/trpc/react";

// Geo types
export type Country = RouterOutputs["geo"]["getCountries"][number];
export type City = RouterOutputs["geo"]["getCitiesByCountry"][number];

// Attraction types
export type AttractionSummary =
  RouterOutputs["attraction"]["getAllAttractions"][number];
export type AttractionDetail = RouterOutputs["attraction"]["getAttractionById"];
export type AttractionRow =
  RouterOutputs["attraction"]["paginateAttractions"]["attractions"][number];

export type AttractionHighlight = AttractionSummary["highlight"];

// Trip types
export type Trip = RouterOutputs["trip"]["getWithItinerary"];
export type TripById = RouterOutputs["trip"]["getTripById"];
export type TripListItem = RouterOutputs["trip"]["listTrips"][number];
export type OvernightStop = TripById["overnightStops"][number];

// Raw attraction types
export type RawAttraction =
  RouterOutputs["rawAttraction"]["getTriageMapData"]["raw"][number];
export type ExistingAttraction =
  RouterOutputs["rawAttraction"]["getTriageMapData"]["existing"][number];

// Route types
export type RouteData = RouterOutputs["route"]["buildRoute"];

// Itinerary types (derived from Trip)
export type ItineraryDayData = Trip["itineraryDays"][number];
export type BasicAttraction = ItineraryDayData["attractions"][number];
