import type { TravelMode } from "~/server/routing/constants";
import type { GeoJSONLineString } from "~/server/routing/ors-client";
import type { ResolvedLeg } from "~/server/routing/resolve-leg";

export type RouteChainLeg = {
  geometry: GeoJSONLineString;
  distanceMeters: number;
  durationSeconds: number;
  travelMode: TravelMode;
  fromAttractionId: number | null;
  toAttractionId: number | null;
};

export type RouteChainResult = {
  legs: RouteChainLeg[];
  unroutableLegCount: number;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
};

export function buildChainResponse(
  legResults: ResolvedLeg[],
): RouteChainResult {
  const legs: RouteChainLeg[] = [];
  let totalDistanceMeters = 0;
  let totalDurationSeconds = 0;

  for (const { fromAttractionId, toAttractionId, data } of legResults) {
    if (!data) continue;

    legs.push({
      geometry: data.geometry,
      distanceMeters: data.distanceMeters,
      durationSeconds: data.durationSeconds,
      travelMode: data.travelMode,
      fromAttractionId,
      toAttractionId,
    });
    totalDistanceMeters += data.distanceMeters;
    totalDurationSeconds += data.durationSeconds;
  }

  return {
    legs,
    unroutableLegCount: legResults.length - legs.length,
    totalDistanceMeters,
    totalDurationSeconds,
  };
}
