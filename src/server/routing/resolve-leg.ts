import { and, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { haversineDistance } from "~/lib/geo";
import { isUnroutableRouteMessage } from "~/lib/itinerary/route-errors";
import type { RoutePoint } from "~/lib/itinerary/route-point";
import { createLogger, errMsg } from "~/lib/logger";
import {
  DIRECT_LEG_CACHE_MAX,
  DRIVING_DISTANCE_THRESHOLD_KM,
  MAX_QUERY_PARAMETERS,
  type TravelMode,
} from "~/server/routing/constants";
import {
  fetchRouteFromOrs,
  orsResponseToLegData,
  type GeoJSONLineString,
} from "~/server/routing/ors-client";
import type { db as tripsDb } from "~/server/db";
import * as schema from "~/server/db/schema";

type RouteDb = typeof tripsDb;

const log = createLogger("route:ors");

export type RouteLegData = {
  geometry: GeoJSONLineString;
  distanceMeters: number;
  durationSeconds: number;
  travelMode: TravelMode;
};

export type ResolvedLeg = {
  /** Null when the endpoint is a bare coordinate rather than a saved attraction. */
  fromAttractionId: number | null;
  toAttractionId: number | null;
  /** Null when the pair is unroutable, e.g. no road access from either end. */
  data: RouteLegData | null;
};

export type ResolvedChain = {
  legs: ResolvedLeg[];
  error: string | null;
};

type LegPair = { from: RoutePoint; to: RoutePoint; travelMode: TravelMode };

const directLegCache = new Map<string, Promise<RouteLegData | null>>();

function getTravelMode(from: RoutePoint, to: RoutePoint): TravelMode {
  const distanceKm = haversineDistance(from.lat, from.lng, to.lat, to.lng);
  return distanceKm > DRIVING_DISTANCE_THRESHOLD_KM ? "driving" : "walking";
}

function attractionId(point: RoutePoint): number | null {
  return point.kind === "attraction" ? point.id : null;
}

function toLegPairs(points: readonly RoutePoint[]): LegPair[] {
  return points.slice(0, -1).map((from, i) => {
    const to = points[i + 1]!;
    return { from, to, travelMode: getTravelMode(from, to) };
  });
}

function attractionPairKey(
  fromId: number,
  toId: number,
  travelMode: TravelMode,
): string {
  return `${fromId}:${toId}:${travelMode}`;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function rowToLegData(row: typeof schema.routes.$inferSelect): RouteLegData {
  return {
    geometry: JSON.parse(row.geoJson) as GeoJSONLineString,
    distanceMeters: row.distanceMeters,
    durationSeconds: row.durationSeconds,
    travelMode: row.travelMode,
  };
}

async function loadCachedAttractionLegs(
  db: RouteDb,
  pairs: LegPair[],
): Promise<Map<string, RouteLegData>> {
  const wanted = new Set<string>();
  const fromIds = new Set<number>();
  const toIds = new Set<number>();

  for (const { from, to, travelMode } of pairs) {
    if (from.kind !== "attraction" || to.kind !== "attraction") continue;
    wanted.add(attractionPairKey(from.id, to.id, travelMode));
    fromIds.add(from.id);
    toIds.add(to.id);
  }

  const cached = new Map<string, RouteLegData>();
  if (wanted.size === 0) return cached;

  // Both id lists have to share one statement's parameter budget.
  const destinationIds = [...toIds];
  const originChunkSize = Math.max(
    1,
    MAX_QUERY_PARAMETERS - destinationIds.length,
  );

  const rowGroups = await Promise.all(
    chunk([...fromIds], originChunkSize).map((ids) =>
      db
        .select()
        .from(schema.routes)
        .where(
          and(
            inArray(schema.routes.fromAttractionId, ids),
            inArray(schema.routes.toAttractionId, destinationIds),
          ),
        ),
    ),
  );

  for (const row of rowGroups.flat()) {
    const key = attractionPairKey(
      row.fromAttractionId,
      row.toAttractionId,
      row.travelMode,
    );
    if (wanted.has(key)) cached.set(key, rowToLegData(row));
  }

  return cached;
}

/**
 * Process-local fallback cache. It is the only cache for legs touching a bare
 * coordinate, since the `routes` table can only key on attraction ids. Caching the
 * promise rather than the value lets concurrent callers share one request, and a
 * cached `null` stops a permanently unroutable pair from being retried forever.
 */
async function fetchLegViaOrsCached(
  from: RoutePoint,
  to: RoutePoint,
  travelMode: TravelMode,
): Promise<RouteLegData | null> {
  const cacheKey = `${from.lat.toFixed(5)},${from.lng.toFixed(5)}->${to.lat.toFixed(5)},${to.lng.toFixed(5)}:${travelMode}`;

  const cached = directLegCache.get(cacheKey);
  if (cached) {
    directLegCache.delete(cacheKey);
    directLegCache.set(cacheKey, cached);
    return cached;
  }

  const pending = (async () => {
    try {
      const data = await fetchRouteFromOrs(
        from.lng,
        from.lat,
        to.lng,
        to.lat,
        travelMode,
      );
      return orsResponseToLegData(data, travelMode);
    } catch (error) {
      if (
        error instanceof TRPCError &&
        isUnroutableRouteMessage(error.message)
      ) {
        log.warn(
          {
            fromLat: from.lat,
            fromLng: from.lng,
            toLat: to.lat,
            toLng: to.lng,
            travelMode,
          },
          "Skipping unroutable leg",
        );
        return null;
      }
      // Transient failures must not be remembered.
      directLegCache.delete(cacheKey);
      throw error;
    }
  })();

  directLegCache.set(cacheKey, pending);
  if (directLegCache.size > DIRECT_LEG_CACHE_MAX) {
    const oldest = directLegCache.keys().next().value;
    if (oldest !== undefined) directLegCache.delete(oldest);
  }

  return pending;
}

async function resolveLeg(
  db: RouteDb,
  pair: LegPair,
  cachedAttractionLegs: Map<string, RouteLegData>,
): Promise<ResolvedLeg> {
  const { from, to, travelMode } = pair;
  const fromId = attractionId(from);
  const toId = attractionId(to);
  const isAttractionPair = fromId !== null && toId !== null;

  if (isAttractionPair) {
    const cached = cachedAttractionLegs.get(
      attractionPairKey(fromId, toId, travelMode),
    );
    if (cached)
      return { fromAttractionId: fromId, toAttractionId: toId, data: cached };
  }

  const fetched = await fetchLegViaOrsCached(from, to, travelMode);

  if (fetched && isAttractionPair) {
    await db
      .insert(schema.routes)
      .values({
        fromAttractionId: fromId,
        toAttractionId: toId,
        geoJson: JSON.stringify(fetched.geometry),
        distanceMeters: fetched.distanceMeters,
        durationSeconds: fetched.durationSeconds,
        travelMode: fetched.travelMode,
      } satisfies typeof schema.routes.$inferInsert)
      .onConflictDoNothing();
  }

  return { fromAttractionId: fromId, toAttractionId: toId, data: fetched };
}

/** A chain that fails reports its own error rather than failing the whole itinerary. */
export async function resolveChains(
  db: RouteDb,
  chains: ReadonlyArray<readonly RoutePoint[]>,
): Promise<ResolvedChain[]> {
  const chainPairs = chains.map(toLegPairs);
  const cachedAttractionLegs = await loadCachedAttractionLegs(
    db,
    chainPairs.flat(),
  );

  return Promise.all(
    chainPairs.map(async (pairs) => {
      try {
        const legs = await Promise.all(
          pairs.map((pair) => resolveLeg(db, pair, cachedAttractionLegs)),
        );
        return { legs, error: null };
      } catch (error) {
        const message =
          error instanceof TRPCError
            ? error.message
            : "Failed to compute route";
        log.error({ error: errMsg(error) }, "Failed to resolve route chain");
        return { legs: [], error: message };
      }
    }),
  );
}
