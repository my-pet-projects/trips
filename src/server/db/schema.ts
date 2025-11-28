import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  sqliteTableCreator,
  text,
  uniqueIndex,
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

export const trips = sqliteTable(
  "trips",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name", { length: 256 }).notNull(),
    startDate: integer("start_date", { mode: "timestamp" }).notNull(),
    endDate: integer("end_date", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => [
    index("trips_start_date_idx").on(table.startDate),
    index("trips_end_date_idx").on(table.endDate),
    index("trips_name_idx").on(table.name),
    check(
      "trips_date_range_check",
      sql`${table.endDate} >= ${table.startDate}`,
    ),
  ],
);

export const tripDestinations = sqliteTable(
  "trip_destinations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tripId: integer("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    countryCode: text("country_code", { length: 2 }).notNull(), // References countries.cca2 in the geo database (cross-database FK not supported)
  },
  (table) => [
    index("trip_destinations_trip_idx").on(table.tripId),
    uniqueIndex("trip_destinations_unique_idx").on(
      table.tripId,
      table.countryCode,
    ),
  ],
);

export const tripsRelations = relations(trips, ({ many }) => ({
  destinations: many(tripDestinations),
  itineraryDays: many(itineraryDays),
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

export const itineraryDays = sqliteTable(
  "itinerary_days",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    name: text("name", { length: 256 }).notNull(),
    tripId: integer("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    dayNumber: integer("day_number").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => [
    index("itinerary_days_trip_idx").on(table.tripId),
    uniqueIndex("itinerary_days_trip_day_unique_idx").on(
      table.tripId,
      table.dayNumber,
    ),
    check("itinerary_days_day_number_check", sql`${table.dayNumber} >= 1`),
  ],
);

export const itineraryDaysRelations = relations(
  itineraryDays,
  ({ one, many }) => ({
    trip: one(trips, {
      fields: [itineraryDays.tripId],
      references: [trips.id],
    }),
    itineraryDayPlaces: many(itineraryDayPlaces),
  }),
);

export const itineraryDayPlaces = sqliteTable(
  "itinerary_day_places",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    itineraryDayId: integer("itinerary_day_id")
      .notNull()
      .references(() => itineraryDays.id, { onDelete: "cascade" }),
    attractionId: integer("attraction_id")
      .notNull()
      .references(() => attractions.id, { onDelete: "restrict" }),
    order: integer("order").notNull(),
  },
  (table) => [
    index("itinerary_day_places_day_idx").on(table.itineraryDayId),
    uniqueIndex("itinerary_day_places_unique_idx").on(
      table.itineraryDayId,
      table.attractionId,
    ),
    uniqueIndex("itinerary_day_places_order_unique_idx").on(
      table.itineraryDayId,
      table.order,
    ),
    check("itinerary_day_places_order_check", sql`${table.order} >= 1`),
  ],
);

export const itineraryDayPlacesRelations = relations(
  itineraryDayPlaces,
  ({ one }) => ({
    itineraryDay: one(itineraryDays, {
      fields: [itineraryDayPlaces.itineraryDayId],
      references: [itineraryDays.id],
    }),
    attraction: one(attractions, {
      fields: [itineraryDayPlaces.attractionId],
      references: [attractions.id],
    }),
  }),
);

export const routes = sqliteTable(
  "routes",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    fromAttractionId: integer("from_attraction_id")
      .notNull()
      .references(() => attractions.id, { onDelete: "cascade" }),
    toAttractionId: integer("to_attraction_id")
      .notNull()
      .references(() => attractions.id, { onDelete: "cascade" }),
    geoJson: text("geo_json").notNull(),
    distanceMeters: real("distance_m").notNull(),
    durationSeconds: real("duration_s").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("routes_unique_idx").on(
      table.fromAttractionId,
      table.toAttractionId,
    ),
    index("routes_from_attraction_idx").on(table.fromAttractionId),
    index("routes_to_attraction_idx").on(table.toAttractionId),
    check(
      "routes_no_self_reference_check",
      sql`${table.fromAttractionId} != ${table.toAttractionId}`,
    ),
  ],
);

export const routesRelations = relations(routes, ({ one }) => ({
  fromAttraction: one(attractions, {
    fields: [routes.fromAttractionId],
    references: [attractions.id],
  }),
  toAttraction: one(attractions, {
    fields: [routes.toAttractionId],
    references: [attractions.id],
  }),
}));
