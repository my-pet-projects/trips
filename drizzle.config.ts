import { type Config } from "drizzle-kit";

import { env } from "~/env";

export default {
  schema: "./src/server/db/schema.ts",
  out: "./migrations",
  dialect: "turso",
  dbCredentials: {
    url: env.TRIPS_DATABASE_URL,
    authToken: env.TRIPS_DATABASE_TOKEN,
  },
} satisfies Config;
