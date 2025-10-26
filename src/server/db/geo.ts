import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import { env } from "~/env";
import * as schema from "./geo-schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForGeoDb = globalThis as unknown as {
  geoClient: Client | undefined;
};

export const geoClient =
  globalForGeoDb.geoClient ??
  createClient({
    url: env.GEO_DATABASE_URL,
    authToken: env.GEO_DATABASE_TOKEN,
  });
if (env.NODE_ENV !== "production") globalForGeoDb.geoClient = geoClient;

export const geoDb = drizzle(geoClient, { schema });
