import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import {
  resolveOvernightLegInputs,
  type OvernightLegInput,
} from "~/lib/itinerary/resolve-overnight-leg-inputs";
import {
  attractionsToRoutePoints,
  type RoutePoint,
} from "~/lib/itinerary/route-point";
import { createLogger } from "~/lib/logger";
import { MAX_CHAIN_POINTS } from "~/server/routing/constants";
import type { db as tripsDb } from "~/server/db";
import * as schema from "~/server/db/schema";

const log = createLogger("route:chains");

export type BlockChain = { blockId: number; points: RoutePoint[] };

export type TripChains = {
  blockChains: BlockChain[];
  overnightLegs: OvernightLegInput[];
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
    if (points.length < 2) continue;

    if (points.length > MAX_CHAIN_POINTS) {
      log.warn(
        { blockId: block.id, pointCount: points.length, MAX_CHAIN_POINTS },
        "Plan block exceeds the routable point limit; routing a prefix only",
      );
    }

    blockChains.push({
      blockId: block.id,
      points: points.slice(0, MAX_CHAIN_POINTS),
    });
  }

  return {
    blockChains,
    overnightLegs: resolveOvernightLegInputs(planBlocks, trip.overnightStops),
  };
}
