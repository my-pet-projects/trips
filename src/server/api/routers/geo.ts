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
        countryCode: z
          .string()
          .length(2)
          .transform((s) => s.toUpperCase()),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { countryCode, search } = input;

      const conditions = [eq(geoSchema.cities.countryCode, countryCode)];

      if (search) {
        conditions.push(like(geoSchema.cities.name, `%${search}%`));
      }

      const citiesWithCountries = await ctx.geoDb
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
        .where(and(...conditions))
        .orderBy(geoSchema.cities.name)
        .limit(100);

      return citiesWithCountries;
    }),
});
