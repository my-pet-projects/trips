import { relations, sql } from "drizzle-orm";
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
  name: text("name", { length: 256 }).notNull(),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }).notNull(),
});

export const tripDestinations = sqliteTable("trip_destinations", {
  id: integer("id").primaryKey(),
  tripId: integer("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  countryCode: text("country_code", { length: 2 }).notNull(), // References countries.cca2 in the geo database (cross-database FK not supported)
});

export const tripsRelations = relations(trips, ({ many }) => ({
  destinations: many(tripDestinations),
}));

export const tripDestinationsRelations = relations(
  tripDestinations,
  ({ one }) => ({
    trip: one(trips, {
      fields: [tripDestinations.tripId],
      references: [trips.id],
    }),
  }),
);

export const attractions = sqliteTable(
  "attractions",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    name: text("name", { length: 256 }).notNull(),
    nameLocal: text("name_local", { length: 256 }),
    description: text("description"),
    address: text("address", { length: 256 }),
    latitude: real("latitude"),
    longitude: real("longitude"),
    sourceUrl: text("source_url", { length: 256 }),
    cityId: integer("city_id").notNull(), // References cities.id in the geo database (cross-database FK not supported)
    countryCode: text("country_code", { length: 2 }).notNull(),
  },
  (table) => [
    index("attractions_city_idx").on(table.cityId),
    index("attractions_coords_idx").on(table.latitude, table.longitude),
  ],
);
