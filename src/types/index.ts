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
export type RouteData = NonNullable<
  RouterOutputs["route"]["forTrip"]["blocks"][number]["route"]
>;
export type OvernightLegData =
  RouterOutputs["route"]["forTrip"]["overnight"][number]["data"];
export type OvernightLegResult = {
  /** Departure leg: overnight stop → first attraction of this block */
  departure?: { stopId: number; toAttractionId: number; data: OvernightLegData };
  /** Arrival leg: last attraction of this block → overnight stop */
  arrival?: { stopId: number; fromAttractionId: number; data: OvernightLegData };
};

// Plan block types (derived from Trip)
export type PlanBlock = Trip["planBlocks"][number];
export type BasicAttraction = PlanBlock["attractions"][number];
export type PlanBlockFieldPatch = Partial<
  Pick<PlanBlock, "name" | "pinnedStartDate" | "pinnedEndDate">
>;
