import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import { env, isProd } from "~/env";
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
if (!isProd) globalForGeoDb.geoClient = geoClient;

export const geoDb = drizzle(geoClient, {
  schema,
  logger: !isProd
    ? {
        logQuery(query) {
          console.log(`\x1b[36m[sql:geo]\x1b[0m ${query}`);
        },
      }
    : undefined,
});
