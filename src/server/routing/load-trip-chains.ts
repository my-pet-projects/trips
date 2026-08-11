import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import {
  resolveTimelineConnectors,
  type TimelineConnectorInput,
} from "~/lib/itinerary/resolve-timeline-connectors";
import {
  attractionsToRoutePoints,
  type RoutePoint,
} from "~/lib/itinerary/route-point";
import type { db as tripsDb } from "~/server/db";
import * as schema from "~/server/db/schema";

export type BlockChain = { blockId: number; points: RoutePoint[] };

export type TripChains = {
  blockChains: BlockChain[];
  connectors: TimelineConnectorInput[];
};

export async function loadTripChains(
  db: typeof tripsDb,
  tripId: number,
): Promise<TripChains> {
  const trip = await db.query.trips.findFirst({
    where: eq(schema.trips.id, tripId),
    columns: { id: true },
    with: {
      overnightStops: {
        columns: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
          checkInDate: true,
          checkOutDate: true,
        },
      },
      planBlocks: {
        columns: {
          id: true,
          blockNumber: true,
          pinnedStartDate: true,
          pinnedEndDate: true,
        },
        orderBy: (block, { asc }) => [asc(block.blockNumber)],
        with: {
          planBlockPlaces: {
            columns: { attractionId: true },
            orderBy: (place, { asc }) => [asc(place.order)],
            with: {
              attraction: {
                columns: { id: true, latitude: true, longitude: true },
              },
            },
          },
        },
      },
    },
  });

  if (!trip) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Trip not found" });
  }

  const planBlocks = trip.planBlocks.map((block) => ({
    ...block,
    attractions: block.planBlockPlaces.map((place) => place.attraction),
  }));

  const blockChains: BlockChain[] = [];
  for (const block of planBlocks) {
    const points = attractionsToRoutePoints(block.attractions);
    if (points.length >= 2) {
      blockChains.push({ blockId: block.id, points });
    }
  }

  return {
    blockChains,
    connectors: resolveTimelineConnectors(planBlocks, trip.overnightStops),
  };
}
