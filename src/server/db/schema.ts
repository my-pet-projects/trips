import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  sqliteTableCreator,
  text,
} from "drizzle-orm/sqlite-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = sqliteTableCreator((name) => `trips_${name}`);

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    name: d.text({ length: 256 }),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [index("name_idx").on(t.name)],
);

export const trips = sqliteTable("trips", {
  id: integer("id").primaryKey(),
});

export const attractions = sqliteTable("attractions", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  nameLocal: text("name_local"),
  description: text("description"),
  address: text("address"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  sourceUrl: text("source_url"),
  cityId: integer("city_id").notNull(), // references the cities table in the separate geo database
});
