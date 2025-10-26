import { eq, inArray } from "drizzle-orm";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import * as geoSchema from "~/server/db/geo-schema";

export const attractionRouter = createTRPCRouter({
  getAttractions: publicProcedure.query(async ({ ctx }) => {
    const attractions = await ctx.db.query.attractions.findMany();

    const cityIds = [
      ...new Set(attractions.map((attraction) => attraction.cityId)),
    ];

    const cities = await ctx.geoDb
      .select({
        id: geoSchema.cities.id,
        name: geoSchema.cities.name,
        countryCode: geoSchema.cities.countryCode,
        country: {
          cca2: geoSchema.countries.cca2,
          cca3: geoSchema.countries.cca3,
          name: geoSchema.countries.name,
        },
      })
      .from(geoSchema.cities)
      .innerJoin(
        geoSchema.countries,
        eq(geoSchema.cities.countryCode, geoSchema.countries.cca2),
      )
      .where(inArray(geoSchema.cities.id, cityIds));

    const cityMap = new Map(cities.map((city) => [city.id, city]));

    return attractions.map((attraction) => ({
      ...attraction,
      city: cityMap.get(attraction.cityId)!,
    }));
  }),
});
