import { relations } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const countries = sqliteTable("countries", {
  cca2: text("cca2", { length: 2 }).primaryKey(),
  cca3: text("cca3", { length: 3 }).notNull(),
  name: text("name_common").notNull(),
});

export const countriesRelations = relations(countries, ({ many }) => ({
  cities: many(cities),
}));

export const cities = sqliteTable("cities", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  countryCode: text("country_code", { length: 2 })
    .references(() => countries.cca2)
    .notNull(),
});

export const citiesRelations = relations(cities, ({ one }) => ({
  country: one(countries, {
    fields: [cities.countryCode],
    references: [countries.cca2],
  }),
}));
