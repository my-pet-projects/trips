import { TRPCError } from "@trpc/server";
import { eq, inArray } from "drizzle-orm";
import z from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import * as geoSchema from "~/server/db/geo-schema";
import * as schema from "~/server/db/schema";

export const tripRouter = createTRPCRouter({
  listTrips: publicProcedure.query(async ({ ctx }) => {
    const trips = await ctx.db.query.trips.findMany({
      orderBy: (trips, { desc }) => [desc(trips.startDate)],
      with: {
        destinations: true,
      },
    });

    const countryCodes = [
      ...new Set(
        trips.flatMap((trip) => trip.destinations.map((d) => d.countryCode)),
      ),
    ];

    const countries =
      countryCodes.length > 0
        ? await ctx.geoDb
            .select()
            .from(geoSchema.countries)
            .where(inArray(geoSchema.countries.cca2, countryCodes))
        : [];

    const countryMap = new Map(
      countries.map((country) => [country.cca2, country]),
    );

    const enrichedTrips = trips.map((trip) => ({
      ...trip,
      destinations: trip.destinations
        .map((dest) => {
          const country = countryMap.get(dest.countryCode);
          if (!country) {
            console.warn(
              `Destination ${dest.id} references non-existent country ${dest.countryCode}`,
            );
            return null;
          }

          return {
            ...dest,
            country: country,
          };
        })
        .filter(
          (destination): destination is NonNullable<typeof destination> =>
            destination !== null,
        ),
    }));

    return enrichedTrips;
  }),

  deleteTrip: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.trips.findFirst({
        where: eq(schema.trips.id, input.id),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trip not found",
        });
      }

      await ctx.db.delete(schema.trips).where(eq(schema.trips.id, input.id));

      return { success: true };
    }),
});
