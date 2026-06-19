/**
 * Shared type definitions derived from tRPC router outputs.
 * These types provide a single source of truth for commonly used entities.
 */
import type { RouterOutputs } from "~/trpc/react";

// Geo types
export type Country = RouterOutputs["geo"]["getCountries"][number];
export type City = RouterOutputs["geo"]["getCitiesByCountry"][number];

// Attraction types
export type Attraction =
  RouterOutputs["attraction"]["getAttractionsByCountries"][number];
export type AttractionById = RouterOutputs["attraction"]["getAttractionById"];
export type PaginatedAttraction =
  RouterOutputs["attraction"]["paginateAttractions"]["attractions"][number];
export type AllAttraction =
  RouterOutputs["attraction"]["getAllAttractions"][number];

// Trip types
export type Trip = RouterOutputs["trip"]["getWithItinerary"];
export type TripById = RouterOutputs["trip"]["getTripById"];
export type TripListItem = RouterOutputs["trip"]["listTrips"][number];

// Raw attraction types
export type RawAttraction =
  RouterOutputs["rawAttraction"]["getByCountry"][number];
export type ExistingAttractionForRaw =
  RouterOutputs["rawAttraction"]["getExistingByCountry"][number];

// Route types
export type RouteData = RouterOutputs["route"]["buildRoute"];

// Itinerary types (derived from Trip)
export type BasicAttraction =
  Trip["itineraryDays"][number]["itineraryDayPlaces"][number]["attraction"];
