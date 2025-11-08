import { and, eq, gt, like, lt, ne } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import * as geoSchema from "~/server/db/geo-schema";

export const geoRouter = createTRPCRouter({
  getCountries: publicProcedure.query(async ({ ctx }) => {
    const countries = await ctx.geoDb.query.countries.findMany({
      orderBy: [geoSchema.countries.name],
    });

    return countries;
  }),

  getCitiesByCountry: publicProcedure
    .input(
      z.object({
        countryCode: z.string().length(2).toUpperCase(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { countryCode, search } = input;

      const whereConditions = [eq(geoSchema.cities.countryCode, countryCode)];
      if (search) {
        whereConditions.push(like(geoSchema.cities.name, `%${search}%`));
      }

      const cities = await ctx.geoDb
        .select({
          id: geoSchema.cities.id,
          name: geoSchema.cities.name,
          countryCode: geoSchema.cities.countryCode,
          latitude: geoSchema.cities.latitude,
          longitude: geoSchema.cities.longitude,
        })
        .from(geoSchema.cities)
        .where(and(...whereConditions))
        .orderBy(geoSchema.cities.name)
        .limit(100);

      return cities;
    }),

  getNearestCities: publicProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        searchRadiusDegrees: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { latitude, longitude, searchRadiusDegrees: distance } = input;

      const cities = await ctx.geoDb
        .select({
          id: geoSchema.cities.id,
          name: geoSchema.cities.name,
          latitude: geoSchema.cities.latitude,
          longitude: geoSchema.cities.longitude,
          countryCode: geoSchema.cities.countryCode,
        })
        .from(geoSchema.cities)
        .where(
          and(
            gt(geoSchema.cities.latitude, latitude - distance),
            lt(geoSchema.cities.latitude, latitude + distance),
            gt(geoSchema.cities.longitude, longitude - distance),
            lt(geoSchema.cities.longitude, longitude + distance),
            ne(geoSchema.cities.latitude, latitude),
            ne(geoSchema.cities.longitude, longitude),
          ),
        )
        .orderBy(geoSchema.cities.name)
        .limit(20);

      return cities;
    }),
});
