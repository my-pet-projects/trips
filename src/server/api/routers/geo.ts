import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const geoRouter = createTRPCRouter({
  getCountries: publicProcedure.query(async ({ ctx }) => {
    const countries = await ctx.geoDb.query.countries.findMany();

    return countries ?? null;
  }),

  getCitiesByCountry: publicProcedure
    .input(z.object({ cca2: z.string().length(2) }))
    .query(async ({ ctx, input }) => {
      const cities = await ctx.geoDb.query.cities.findMany({
        where: (cities, { eq }) => eq(cities.countryCode, input.cca2),
      });

      return cities ?? null;
    }),
});
