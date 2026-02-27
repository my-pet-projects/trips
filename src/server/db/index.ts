import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import { env, isProd } from "~/env";
import { createLogger } from "~/lib/logger";
import * as schema from "./schema";

const log = createLogger("sql:trips");

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  client: Client | undefined;
};

export const client =
  globalForDb.client ??
  createClient({
    url: env.TRIPS_DATABASE_URL,
    authToken: env.TRIPS_DATABASE_TOKEN,
  });
if (!isProd) globalForDb.client = client;

export const db = drizzle(client, {
  schema,
  logger: !isProd
    ? {
        logQuery(query) {
          console.log(`\x1b[36m[sql:trips]\x1b[0m ${query}`);
        },
      }
    : undefined,
});
