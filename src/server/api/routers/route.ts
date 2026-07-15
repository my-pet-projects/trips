import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { env } from "~/env";
import { haversineDistance } from "~/lib/geo";
import { isUnroutableRouteMessage } from "~/lib/itinerary/route-errors";
import { createLogger, errMsg } from "~/lib/logger";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import * as schema from "~/server/db/schema";

const log = createLogger("route:ors");

interface OrsResponse {
  routes: Array<{
    geometry: string;
    segments: Array<{
      distance: number;
      duration: number;
    }>;
  }>;
}

type OrsDirectionsErrorBody = {
  error?:
    | string
    | {
        code: number;
        message: string;
      };
  info?: {
    engine?: { version?: string; build_date?: string };
    timestamp?: number;
  };
};

function parseOrsDirectionsErrorMessage(
  body: OrsDirectionsErrorBody,
  httpStatus: number,
): string {
  const { error } = body;

  if (typeof error === "string") {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  return `Routing request failed (HTTP ${httpStatus})`;
}

function mapOrsDirectionsHttpStatusToTrpcCode(
  httpStatus: number,
): TRPCError["code"] {
  switch (httpStatus) {
    case 400:
    case 413:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 429:
      return "TOO_MANY_REQUESTS";
    default:
      return "INTERNAL_SERVER_ERROR";
  }
}

type GeoJSON = {
  type: "LineString";
  coordinates: [number, number][];
};

type TravelMode = typeof schema.routes.$inferSelect.travelMode;

const ORS_API_BASE_URL = "https://api.openrouteservice.org/v2/directions";
const ORS_PROFILES = {
  walking: "foot-walking",
  driving: "driving-car",
} satisfies Record<TravelMode, string>;
const DRIVING_DISTANCE_THRESHOLD_KM = 3;
/** @see https://openrouteservice.org/restrictions/ — Directions: Route waypoints max 50 */
const MAX_ROUTE_WAYPOINTS = 50;
const ORS_TIMEOUT_MS = 10000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

function getTravelMode(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): TravelMode {
  const distanceKm = haversineDistance(fromLat, fromLng, toLat, toLng);
  return distanceKm > DRIVING_DISTANCE_THRESHOLD_KM ? "driving" : "walking";
}

/**
 * Decode Google Polyline encoded string to coordinates
 * ORS uses Google's polyline encoding format
 */
function decodePolyline(encoded: string): [number, number][] {
  const coordinates: [number, number][] = [];
  let index = 0,
    lat = 0,
    lng = 0;

  while (index < encoded.length) {
    let shift = 0,
      result = 0,
      byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coordinates.push([lng / 1e5, lat / 1e5]);
  }

  return coordinates;
}

async function fetchRouteFromORS(
  fromLng: number,
  fromLat: number,
  toLng: number,
  toLat: number,
  travelMode: TravelMode,
  retryCount = 0,
): Promise<OrsResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ORS_TIMEOUT_MS);
  const startTime = Date.now();
  const profile = ORS_PROFILES[travelMode];

  log.debug(
    { fromLng, fromLat, toLng, toLat, travelMode, profile, retryCount },
    "Fetching route from OpenRouteService",
  );

  try {
    const response = await fetch(`${ORS_API_BASE_URL}/${profile}`, {
      method: "POST",
      headers: {
        Authorization: env.OPENROUTE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coordinates: [
          [fromLng, fromLat],
          [toLng, toLat],
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;

    if (!response.ok) {
      const errorData = (await response
        .json()
        .catch(() => ({}))) as OrsDirectionsErrorBody;

      log.warn(
        {
          status: response.status,
          orsErrorCode:
            typeof errorData.error === "object"
              ? errorData.error?.code
              : undefined,
          errorData,
          durationMs,
          retryCount,
        },
        "OpenRouteService directions API error",
      );

      if (response.status === 429 && retryCount < MAX_RETRIES) {
        log.info({ retryCount: retryCount + 1 }, "Rate limited, retrying...");
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY_MS * (retryCount + 1)),
        );
        return fetchRouteFromORS(
          fromLng,
          fromLat,
          toLng,
          toLat,
          travelMode,
          retryCount + 1,
        );
      }

      throw new TRPCError({
        code: mapOrsDirectionsHttpStatusToTrpcCode(response.status),
        message: parseOrsDirectionsErrorMessage(errorData, response.status),
      });
    }

    const data = (await response.json()) as OrsResponse;

    if (!data.routes?.[0]?.segments?.[0]) {
      log.error(
        { data, durationMs },
        "Invalid ORS response - missing route data",
      );
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Invalid response from OpenRouteService: missing route data",
      });
    }

    log.info(
      {
        durationMs,
        distance: data.routes[0]?.segments[0]?.distance,
        routeDuration: data.routes[0]?.segments[0]?.duration,
        travelMode,
      },
      "Route fetched successfully",
    );

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;

    if (error instanceof TRPCError) throw error;

    if (error instanceof Error && error.name === "AbortError") {
      log.warn({ durationMs, retryCount }, "ORS request timed out");
      if (retryCount < MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY_MS * (retryCount + 1)),
        );
        return fetchRouteFromORS(
          fromLng,
          fromLat,
          toLng,
          toLat,
          travelMode,
          retryCount + 1,
        );
      }
      throw new TRPCError({
        code: "TIMEOUT",
        message: "OpenRouteService request timed out",
      });
    }

    log.error(
      { error: errMsg(error), durationMs },
      "Failed to fetch route from ORS",
    );
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch route from OpenRouteService",
      cause: errMsg(error),
    });
  }
}

export const routeRouter = createTRPCRouter({
  buildRoute: publicProcedure
    .input(
      z.object({
        points: z
          .array(
            z.object({
              id: z.number().int().positive(),
              lat: z.number().min(-90).max(90),
              lng: z.number().min(-180).max(180),
            }),
          )
          .min(2, "At least two points required")
          .max(
            MAX_ROUTE_WAYPOINTS,
            `Maximum ${MAX_ROUTE_WAYPOINTS} points allowed`,
          )
          .refine(
            (points) =>
              points.every((p, i) => i === 0 || p.id !== points[i - 1]!.id),
            "Consecutive points cannot have the same attraction ID",
          ),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Fetch all legs in parallel
      const legPromises = input.points
        .slice(0, -1)
        .map(async (fromPoint, i) => {
          const toPoint = input.points[i + 1]!;
          const travelMode = getTravelMode(
            fromPoint.lat,
            fromPoint.lng,
            toPoint.lat,
            toPoint.lng,
          );

          // Check cache
          let leg = await ctx.db
            .select()
            .from(schema.routes)
            .where(
              and(
                eq(schema.routes.fromAttractionId, fromPoint.id),
                eq(schema.routes.toAttractionId, toPoint.id),
                eq(schema.routes.travelMode, travelMode),
              ),
            )
            .limit(1)
            .then((rows) => rows[0]);

          if (leg) {
            return {
              kind: "routed" as const,
              leg,
              fromAttractionId: fromPoint.id,
              toAttractionId: toPoint.id,
            };
          }

          // Fetch from ORS
          try {
            const data = await fetchRouteFromORS(
              fromPoint.lng,
              fromPoint.lat,
              toPoint.lng,
              toPoint.lat,
              travelMode,
            );

            const route = data.routes[0]!;
            const segment = route.segments[0]!;
            const coordinates = decodePolyline(route.geometry);

            const geometry: GeoJSON = {
              type: "LineString",
              coordinates,
            };

            const newLeg = {
              fromAttractionId: fromPoint.id,
              toAttractionId: toPoint.id,
              geoJson: JSON.stringify(geometry),
              distanceMeters: segment.distance,
              durationSeconds: segment.duration,
              travelMode,
            } satisfies typeof schema.routes.$inferInsert;

            // Insert and return
            const inserted = await ctx.db
              .insert(schema.routes)
              .values(newLeg)
              .onConflictDoNothing()
              .returning()
              .then((rows) => rows[0]);

            // Handle race condition
            leg =
              inserted ??
              (await ctx.db
                .select()
                .from(schema.routes)
                .where(
                  and(
                    eq(schema.routes.fromAttractionId, fromPoint.id),
                    eq(schema.routes.toAttractionId, toPoint.id),
                    eq(schema.routes.travelMode, travelMode),
                  ),
                )
                .limit(1)
                .then((rows) => rows[0]));

            if (!leg) {
              log.error(
                { fromId: fromPoint.id, toId: toPoint.id, travelMode },
                "Failed to retrieve route leg",
              );
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: `Failed to retrieve route leg from ${fromPoint.id} to ${toPoint.id}`,
              });
            }

            return {
              kind: "routed" as const,
              leg,
              fromAttractionId: fromPoint.id,
              toAttractionId: toPoint.id,
            };
          } catch (error) {
            if (
              error instanceof TRPCError &&
              isUnroutableRouteMessage(error.message)
            ) {
              log.warn(
                {
                  fromId: fromPoint.id,
                  toId: toPoint.id,
                  travelMode,
                },
                "Skipping unroutable itinerary leg",
              );
              return {
                kind: "unroutable" as const,
                fromAttractionId: fromPoint.id,
                toAttractionId: toPoint.id,
              };
            }

            if (error instanceof TRPCError) throw error;

            log.error(
              {
                fromId: fromPoint.id,
                toId: toPoint.id,
                travelMode,
                error: errMsg(error),
              },
              "Failed to compute route",
            );
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to compute route from attraction ${fromPoint.id} to ${toPoint.id}`,
              cause: errMsg(error),
            });
          }
        });

      const legResults = await Promise.all(legPromises);
      const routedLegs = legResults.filter(
        (result) => result.kind === "routed",
      );
      const unroutableLegs = legResults
        .filter((result) => result.kind === "unroutable")
        .map(({ fromAttractionId, toAttractionId }) => ({
          fromAttractionId,
          toAttractionId,
        }));

      const allCoordinates: [number, number][] = [];
      let totalDistanceMeters = 0;
      let totalDurationSeconds = 0;

      const parsedGeometries = routedLegs.map(
        ({ leg }) => JSON.parse(leg.geoJson) as GeoJSON,
      );

      parsedGeometries.forEach((geometry, i) => {
        const currentLeg = routedLegs[i]!;
        const previousLeg = routedLegs[i - 1];
        const isContiguous =
          previousLeg?.toAttractionId === currentLeg.fromAttractionId;
        const coords = isContiguous
          ? geometry.coordinates.slice(1)
          : geometry.coordinates;
        allCoordinates.push(...coords);
        totalDistanceMeters += currentLeg.leg.distanceMeters;
        totalDurationSeconds += currentLeg.leg.durationSeconds;
      });

      return {
        legs: routedLegs.map(
          ({ leg, fromAttractionId, toAttractionId }, i) => ({
            ...leg,
            geometryGeojsonParsed: parsedGeometries[i]!,
            fromAttractionId,
            toAttractionId,
          }),
        ),
        unroutableLegs,
        geojson: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: allCoordinates,
          },
          properties: {
            totalDistanceMeters,
            totalDurationSeconds,
            legCount: routedLegs.length,
          },
        },
        totalKm: totalDistanceMeters / 1000,
        totalDurationMinutes: totalDurationSeconds / 60,
        totalDistanceMeters,
        totalDurationSeconds,
      };
    }),
});
