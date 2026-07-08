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
 * Multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = sqliteTableCreator((name) => `trips_${name}`);

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

export const tripOvernightStops = sqliteTable(
  "trip_overnight_stops",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tripId: integer("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    name: text("name", { length: 256 }).notNull(),
    address: text("address").notNull(),
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),
    checkInDate: integer("check_in_date", { mode: "timestamp" }).notNull(),
    checkOutDate: integer("check_out_date", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => [
    index("trip_overnight_stops_trip_idx").on(table.tripId),
    index("trip_overnight_stops_check_in_idx").on(
      table.tripId,
      table.checkInDate,
    ),
    check(
      "trip_overnight_stops_check_out_after_check_in",
      sql`${table.checkOutDate} > ${table.checkInDate}`,
    ),
  ],
);

export const tripsRelations = relations(trips, ({ many }) => ({
  destinations: many(tripDestinations),
  overnightStops: many(tripOvernightStops),
  planBlocks: many(planBlocks),
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

export const tripOvernightStopsRelations = relations(
  tripOvernightStops,
  ({ one }) => ({
    trip: one(trips, {
      fields: [tripOvernightStops.tripId],
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
    address: text("address"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    highlight: text("highlight", { enum: ["must_see", "recommended", "skip"] }),
    isPredefined: integer("is_predefined", { mode: "boolean" }),
    sourceUrl: text("source_url", { length: 256 }),
    cityId: integer("city_id").notNull(), // References cities.id in the geo database (cross-database FK not supported)
    countryCode: text("country_code", { length: 2 }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$onUpdate(
      () => new Date(),
    ),
    isVerified: integer("is_verified", { mode: "boolean" })
      .default(false)
      .notNull(),
  },
  (table) => [
    index("attractions_city_idx").on(table.cityId),
    index("attractions_coords_idx").on(table.latitude, table.longitude),
    index("attractions_country_id_idx").on(table.countryCode, table.id),
  ],
);

export const planBlocks = sqliteTable(
  "plan_blocks",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    name: text("name", { length: 256 }).notNull(),
    tripId: integer("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    blockNumber: integer("block_number").notNull(),
    pinnedStartDate: integer("pinned_start_date", { mode: "timestamp" }),
    pinnedEndDate: integer("pinned_end_date", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => [
    index("plan_blocks_trip_idx").on(table.tripId),
    uniqueIndex("plan_blocks_trip_block_unique_idx").on(
      table.tripId,
      table.blockNumber,
    ),
    check("plan_blocks_block_number_check", sql`${table.blockNumber} >= 1`),
    check(
      "plan_blocks_pinned_end_after_start",
      sql`${table.pinnedEndDate} IS NULL OR ${table.pinnedStartDate} IS NOT NULL`,
    ),
    check(
      "plan_blocks_pinned_range_valid",
      sql`${table.pinnedEndDate} IS NULL OR ${table.pinnedStartDate} IS NULL OR ${table.pinnedEndDate} >= ${table.pinnedStartDate}`,
    ),
  ],
);

export const planBlocksRelations = relations(planBlocks, ({ one, many }) => ({
  trip: one(trips, {
    fields: [planBlocks.tripId],
    references: [trips.id],
  }),
  planBlockPlaces: many(planBlockPlaces),
}));

export const planBlockPlaces = sqliteTable(
  "plan_block_places",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    planBlockId: integer("plan_block_id")
      .notNull()
      .references(() => planBlocks.id, { onDelete: "cascade" }),
    attractionId: integer("attraction_id")
      .notNull()
      .references(() => attractions.id, { onDelete: "restrict" }),
    order: integer("order").notNull(),
  },
  (table) => [
    index("plan_block_places_block_idx").on(table.planBlockId),
    uniqueIndex("plan_block_places_unique_idx").on(
      table.planBlockId,
      table.attractionId,
    ),
    uniqueIndex("plan_block_places_order_unique_idx").on(
      table.planBlockId,
      table.order,
    ),
    check("plan_block_places_order_check", sql`${table.order} >= 1`),
  ],
);

export const planBlockPlacesRelations = relations(
  planBlockPlaces,
  ({ one }) => ({
    planBlock: one(planBlocks, {
      fields: [planBlockPlaces.planBlockId],
      references: [planBlocks.id],
    }),
    attraction: one(attractions, {
      fields: [planBlockPlaces.attractionId],
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

export const rawAttractions = sqliteTable(
  "raw_attractions",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    name: text("name", { length: 256 }).notNull(),
    nameLocal: text("name_local", { length: 256 }),
    description: text("description"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    sourceUrl: text("source_url", { length: 256 }),
    cityName: text("city_name", { length: 256 }),
    cityId: integer("city_id"),
    countryCode: text("country_code", { length: 2 }).notNull(),
    source: text("source", { length: 64 }).notNull(),
    status: text("status", { enum: ["pending", "approved", "rejected", "duplicated"] })
      .default("pending")
      .notNull(),
    attractionId: integer("attraction_id").references(() => attractions.id, {
      onDelete: "set null",
    }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => [
    index("raw_attractions_status_idx").on(table.status),
    index("raw_attractions_country_idx").on(table.countryCode),
    index("raw_attractions_country_status_id_idx").on(
      table.countryCode,
      table.status,
      table.id,
    ),
    index("raw_attractions_city_idx").on(table.cityId),
    uniqueIndex("raw_attractions_source_url_idx").on(table.sourceUrl),
    index("raw_attractions_attraction_idx").on(table.attractionId),
  ],
);

export const rawAttractionsRelations = relations(rawAttractions, ({ one }) => ({
  attraction: one(attractions, {
    fields: [rawAttractions.attractionId],
    references: [attractions.id],
  }),
}));
