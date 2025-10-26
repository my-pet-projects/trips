import { eq, inArray } from "drizzle-orm";
import z from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import * as geoSchema from "~/server/db/geo-schema";

export const attractionRouter = createTRPCRouter({
  paginateAttractions: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(10),
          offset: z.number().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { limit = 10, offset = 0 } = input ?? {};
      const attractions = await ctx.db.query.attractions.findMany({
        limit,
        offset,
      });

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

      return {
        attractions: attractions
          .map((attraction) => {
            const city = cityMap.get(attraction.cityId);
            if (!city) {
              console.warn(
                `Attraction ${attraction.id} references non-existent city ${attraction.cityId}`,
              );
              return null;
            }
            return {
              ...attraction,
              city,
            };
          })
          .filter(
            (attraction): attraction is NonNullable<typeof attraction> =>
              attraction !== null,
          ),
        pagination: {
          limit,
          offset,
          total: attractions.length,
        },
      };
    }),
});
