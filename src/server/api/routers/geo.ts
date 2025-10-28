import { and, eq, like } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import * as geoSchema from "~/server/db/geo-schema";

export const geoRouter = createTRPCRouter({
  getCountries: publicProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const { search } = input ?? {};

      const countries = await ctx.geoDb.query.countries.findMany({
        where: search
          ? like(geoSchema.countries.name, `%${search}%`)
          : undefined,
        orderBy: [geoSchema.countries.name],
      });

      return countries;
    }),

  getCitiesByCountry: publicProcedure
    .input(
      z.object({
        countryCode: z.string(),
        search: z.string().optional(),
        cityId: z.number().optional(), // NEW: optional cityId filter
      }),
    )
    .query(async ({ ctx, input }) => {
      const { countryCode, search, cityId } = input;

      const whereConditions = [eq(geoSchema.cities.countryCode, countryCode)];

      // If cityId is provided, only fetch that specific city
      if (cityId) {
        whereConditions.push(eq(geoSchema.cities.id, cityId));
      } else if (search) {
        // Only apply search if we're not filtering by specific cityId
        whereConditions.push(like(geoSchema.cities.name, `%${search}%`));
      }

      const cities = await ctx.geoDb
        .select({
          id: geoSchema.cities.id,
          name: geoSchema.cities.name,
          countryCode: geoSchema.cities.countryCode,
        })
        .from(geoSchema.cities)
        .where(and(...whereConditions))
        .limit(cityId ? 1 : 100); // Limit to 1 if fetching specific city

      return cities;
    }),

  getCityById: publicProcedure
    .input(z.object({ cityId: z.number() }))
    .query(async ({ ctx, input }) => {
      const [city] = await ctx.geoDb
        .select({
          id: geoSchema.cities.id,
          name: geoSchema.cities.name,
          countryCode: geoSchema.cities.countryCode,
        })
        .from(geoSchema.cities)
        .where(eq(geoSchema.cities.id, input.cityId))
        .limit(1);

      return city ?? null;
    }),
});
