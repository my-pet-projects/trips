import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { env } from "~/env";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import * as schema from "~/server/db/schema";

interface OrsResponse {
  routes: Array<{
    geometry: string;
    segments: Array<{
      distance: number;
      duration: number;
    }>;
  }>;
}

interface OrsErrorResponse {
  error?: {
    code: number;
    message: string;
  };
  message?: string;
}

type GeoJSON = {
  type: "LineString";
  coordinates: [number, number][];
};

const ORS_API_URL =
  "https://api.openrouteservice.org/v2/directions/foot-walking";
const ORS_TIMEOUT_MS = 10000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

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
  retryCount = 0,
): Promise<OrsResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ORS_TIMEOUT_MS);

  try {
    const response = await fetch(ORS_API_URL, {
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

    if (!response.ok) {
      const errorData = (await response
        .json()
        .catch(() => ({}))) as OrsErrorResponse;

      if (response.status === 429 && retryCount < MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY_MS * (retryCount + 1)),
        );
        return fetchRouteFromORS(
          fromLng,
          fromLat,
          toLng,
          toLat,
          retryCount + 1,
        );
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `OpenRouteService API error: ${response.status}`,
        cause: errorData.error?.message ?? errorData.message ?? "Unknown error",
      });
    }

    const data = (await response.json()) as OrsResponse;

    if (!data.routes?.[0]?.segments?.[0]) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Invalid response from OpenRouteService: missing route data",
      });
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof TRPCError) throw error;

    if (error instanceof Error && error.name === "AbortError") {
      if (retryCount < MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY_MS * (retryCount + 1)),
        );
        return fetchRouteFromORS(
          fromLng,
          fromLat,
          toLng,
          toLat,
          retryCount + 1,
        );
      }
      throw new TRPCError({
        code: "TIMEOUT",
        message: "OpenRouteService request timed out",
      });
    }

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch route from OpenRouteService",
      cause: error instanceof Error ? error.message : "Unknown error",
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
          .max(25, "Maximum 25 points allowed")
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

          // Check cache
          let leg = await ctx.db
            .select()
            .from(schema.routes)
            .where(
              and(
                eq(schema.routes.fromAttractionId, fromPoint.id),
                eq(schema.routes.toAttractionId, toPoint.id),
              ),
            )
            .limit(1)
            .then((rows) => rows[0]);

          if (leg) return leg;

          // Fetch from ORS
          try {
            const data = await fetchRouteFromORS(
              fromPoint.lng,
              fromPoint.lat,
              toPoint.lng,
              toPoint.lat,
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
                  ),
                )
                .limit(1)
                .then((rows) => rows[0]));

            if (!leg) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: `Failed to retrieve route leg from ${fromPoint.id} to ${toPoint.id}`,
              });
            }

            return leg;
          } catch (error) {
            if (error instanceof TRPCError) throw error;

            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to compute route from attraction ${fromPoint.id} to ${toPoint.id}`,
              cause: error instanceof Error ? error.message : "Unknown error",
            });
          }
        });

      const legs = await Promise.all(legPromises);

      const allCoordinates: [number, number][] = [];
      let totalDistanceMeters = 0;
      let totalDurationSeconds = 0;

      const parsedGeometries = legs.map(
        (leg) => JSON.parse(leg.geoJson) as GeoJSON,
      );

      parsedGeometries.forEach((geometry, i) => {
        const coords =
          i === 0 ? geometry.coordinates : geometry.coordinates.slice(1);
        allCoordinates.push(...coords);
        totalDistanceMeters += legs[i]!.distanceMeters;
        totalDurationSeconds += legs[i]!.durationSeconds;
      });

      return {
        legs: legs.map((leg, i) => ({
          ...leg,
          geometryGeojsonParsed: parsedGeometries[i]!,
          fromAttractionId: input.points[i]!.id,
          toAttractionId: input.points[i + 1]!.id,
        })),
        geojson: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: allCoordinates,
          },
          properties: {
            totalDistanceMeters,
            totalDurationSeconds,
            legCount: legs.length,
          },
        },
        totalKm: totalDistanceMeters / 1000,
        totalDurationMinutes: totalDurationSeconds / 60,
        totalDistanceMeters,
        totalDurationSeconds,
      };
    }),
});
