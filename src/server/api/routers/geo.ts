import { and, eq, like } from "drizzle-orm";
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
        })
        .from(geoSchema.cities)
        .where(and(...whereConditions))
        .orderBy(geoSchema.cities.name)
        .limit(100);

      return cities;
    }),
});
