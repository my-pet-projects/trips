import type * as schema from "~/server/db/schema";

export type TravelMode = typeof schema.routes.$inferSelect.travelMode;

export const ORS_API_BASE_URL =
  "https://api.openrouteservice.org/v2/directions";
export const ORS_PROFILES = {
  walking: "foot-walking",
  driving: "driving-car",
} satisfies Record<TravelMode, string>;
export const DRIVING_DISTANCE_THRESHOLD_KM = 3;
/** SQLite caps bound parameters per statement; stay well below it when batching `IN (...)`. */
export const MAX_QUERY_PARAMETERS = 900;
export const ORS_TIMEOUT_MS = 10000;
export const MAX_RETRIES = 2;
export const RETRY_DELAY_MS = 1000;
export const DIRECT_LEG_CACHE_MAX = 500;
/** Caps simultaneous outbound ORS requests so one cold trip cannot burst the quota. */
export const MAX_ORS_CONCURRENCY = 4;
