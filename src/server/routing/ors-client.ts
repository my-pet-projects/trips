import { TRPCError } from "@trpc/server";

import { env } from "~/env";
import { createLogger, errMsg } from "~/lib/logger";
import {
  ORS_API_BASE_URL,
  ORS_PROFILES,
  ORS_TIMEOUT_MS,
  MAX_RETRIES,
  MAX_RETRY_DELAY_MS,
  RETRY_DELAY_MS,
  type TravelMode,
} from "~/server/routing/constants";

const log = createLogger("route:ors");

/**
 * Jitter keeps the concurrent legs of one trip from retrying in lockstep.
 * `Retry-After` is honoured but clamped in both directions: ORS can name a whole
 * quota window, which would otherwise hold the request open for that long.
 */
function retryDelayMs(retryCount: number, retryAfterHeader?: string | null) {
  const headerSeconds = retryAfterHeader ? Number(retryAfterHeader) : NaN;
  const backoff = RETRY_DELAY_MS * (retryCount + 1);
  const base =
    Number.isFinite(headerSeconds) && headerSeconds > 0
      ? Math.min(headerSeconds * 1000, MAX_RETRY_DELAY_MS)
      : backoff;
  return Math.max(base, backoff) + Math.random() * RETRY_DELAY_MS;
}

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
};

export type GeoJSONLineString = {
  type: "LineString";
  coordinates: [number, number][];
};

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

function mapOrsHttpStatusToTrpcCode(httpStatus: number): TRPCError["code"] {
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

function parseOrsErrorMessage(
  body: OrsDirectionsErrorBody,
  httpStatus: number,
): string {
  if (typeof body.error === "string") return body.error;
  if (body.error?.message) return body.error.message;
  return `Routing request failed (HTTP ${httpStatus})`;
}

export async function fetchRouteFromOrs(
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
          setTimeout(
            resolve,
            retryDelayMs(retryCount, response.headers.get("retry-after")),
          ),
        );
        return fetchRouteFromOrs(
          fromLng,
          fromLat,
          toLng,
          toLat,
          travelMode,
          retryCount + 1,
        );
      }

      throw new TRPCError({
        code: mapOrsHttpStatusToTrpcCode(response.status),
        message: parseOrsErrorMessage(errorData, response.status),
      });
    }

    const data = (await response.json()) as OrsResponse;

    if (!data.routes?.[0]?.segments?.[0]) {
      log.error(
        { routeCount: data.routes?.length ?? 0, durationMs },
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
          setTimeout(resolve, retryDelayMs(retryCount)),
        );
        return fetchRouteFromOrs(
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

export function orsResponseToLegData(
  data: OrsResponse,
  travelMode: TravelMode,
): {
  geometry: GeoJSONLineString;
  distanceMeters: number;
  durationSeconds: number;
  travelMode: TravelMode;
} {
  const route = data.routes[0]!;
  const segment = route.segments[0]!;
  return {
    geometry: {
      type: "LineString",
      coordinates: decodePolyline(route.geometry),
    },
    distanceMeters: segment.distance,
    durationSeconds: segment.duration,
    travelMode,
  };
}
