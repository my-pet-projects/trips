import type * as schema from "~/server/db/schema";

export type TravelMode = typeof schema.routes.$inferSelect.travelMode;

export const ORS_API_BASE_URL =
  "https://api.openrouteservice.org/v2/directions";
export const ORS_PROFILES = {
  walking: "foot-walking",
  driving: "driving-car",
} satisfies Record<TravelMode, string>;
export const DRIVING_DISTANCE_THRESHOLD_KM = 3;
/** Upper bound on points per chain, to cap ORS fan-out for very large plan blocks. */
export const MAX_CHAIN_POINTS = 50;
/** SQLite caps bound parameters per statement; chunk `IN (...)` lookups below it. */
export const CACHE_LOOKUP_CHUNK_SIZE = 500;
export const ORS_TIMEOUT_MS = 10000;
export const MAX_RETRIES = 2;
export const RETRY_DELAY_MS = 1000;
export const DIRECT_LEG_CACHE_MAX = 500;
