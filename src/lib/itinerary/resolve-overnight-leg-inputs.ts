import {
  buildFlexibleItineraryTimeline,
  type TimelineOvernightStopLike,
  type TimelinePlanBlockLike,
} from "~/lib/itinerary/build-flexible-itinerary-timeline";
import type { RoutePoint } from "~/lib/itinerary/route-point";

export type GeocodedAttractionLike = {
  id: number;
  latitude: number | null;
  longitude: number | null;
};

export type PlanBlockLike = TimelinePlanBlockLike & {
  attractions: GeocodedAttractionLike[];
};

export type OvernightStopLike = TimelineOvernightStopLike & {
  latitude: number;
  longitude: number;
};

export type OvernightLegInput = {
  blockId: number;
  kind: "departure" | "arrival";
  stopId: number;
  attractionId: number;
  points: [RoutePoint, RoutePoint];
};

function firstGeocoded(
  attractions: GeocodedAttractionLike[],
): GeocodedAttractionLike | undefined {
  return attractions.find((a) => a.latitude != null && a.longitude != null);
}

function lastGeocoded(
  attractions: GeocodedAttractionLike[],
): GeocodedAttractionLike | undefined {
  return [...attractions]
    .reverse()
    .find((a) => a.latitude != null && a.longitude != null);
}

export function resolveOvernightLegInputs(
  planBlocks: readonly PlanBlockLike[],
  overnightStops: readonly OvernightStopLike[],
): OvernightLegInput[] {
  const timeline = buildFlexibleItineraryTimeline(planBlocks, overnightStops);
  const inputs: OvernightLegInput[] = [];

  for (let i = 0; i < timeline.entries.length - 1; i++) {
    const current = timeline.entries[i]!;
    const next = timeline.entries[i + 1]!;

    if (current.type === "plan" && next.type === "stay") {
      const lastAttraction = lastGeocoded(current.block.attractions);
      if (!lastAttraction) continue;

      inputs.push({
        blockId: current.block.id,
        kind: "arrival",
        stopId: next.stop.id,
        attractionId: lastAttraction.id,
        points: [
          {
            kind: "attraction",
            id: lastAttraction.id,
            lat: lastAttraction.latitude!,
            lng: lastAttraction.longitude!,
          },
          {
            kind: "coordinate",
            lat: next.stop.latitude,
            lng: next.stop.longitude,
          },
        ],
      });
      continue;
    }

    if (current.type === "stay" && next.type === "plan") {
      const firstAttraction = firstGeocoded(next.block.attractions);
      if (!firstAttraction) continue;

      inputs.push({
        blockId: next.block.id,
        kind: "departure",
        stopId: current.stop.id,
        attractionId: firstAttraction.id,
        points: [
          {
            kind: "coordinate",
            lat: current.stop.latitude,
            lng: current.stop.longitude,
          },
          {
            kind: "attraction",
            id: firstAttraction.id,
            lat: firstAttraction.latitude!,
            lng: firstAttraction.longitude!,
          },
        ],
      });
    }
  }

  return inputs;
}
