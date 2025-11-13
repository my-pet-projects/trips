import { TRPCError } from "@trpc/server";
import { eq, inArray } from "drizzle-orm";
import z from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import * as geoSchema from "~/server/db/geo-schema";
import * as schema from "~/server/db/schema";

const tripCoreSchema = z.object({
  name: z.string().min(1, "Name is required").max(256),
  startDate: z.date(),
  endDate: z.date(),
  destinations: z
    .array(
      z.object({
        countryCode: z.string().length(2),
      }),
    )
    .min(1, "At least one destination is required"),
});

const tripCreateSchema = tripCoreSchema.refine(
  (data) => data.startDate <= data.endDate,
  {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
  },
);

const tripUpdateSchema = z
  .object({
    id: z.number(),
  })
  .merge(tripCoreSchema)
  .refine((data) => data.startDate <= data.endDate, {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
  });

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

  getTripById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const trip = await ctx.db.query.trips.findFirst({
        where: eq(schema.trips.id, input.id),
        with: {
          destinations: true,
        },
      });

      if (!trip) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trip not found",
        });
      }

      return trip;
    }),

  getWithItinerary: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const trip = await ctx.db.query.trips.findFirst({
        where: eq(schema.trips.id, input.id),
        with: {
          destinations: true,
          itineraryDays: {
            orderBy: (day, { asc }) => [asc(day.dayNumber)],
          },
        },
      });

      if (!trip) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trip not found",
        });
      }

      return trip;
    }),

  create: publicProcedure
    .input(tripCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { destinations, ...tripData } = input;

      // Insert trip
      const tripResult = await ctx.db
        .insert(schema.trips)
        .values(tripData)
        .returning();

      const trip = tripResult[0];
      if (!trip) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create trip",
        });
      }

      // Insert destinations
      if (destinations.length > 0) {
        await ctx.db.insert(schema.tripDestinations).values(
          destinations.map((dest) => ({
            tripId: trip.id,
            countryCode: dest.countryCode,
          })),
        );
      }

      return trip;
    }),

  update: publicProcedure
    .input(tripUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, destinations, ...updateData } = input;

      const existing = await ctx.db.query.trips.findFirst({
        where: eq(schema.trips.id, id),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trip not found",
        });
      }

      const tripResult = await ctx.db
        .update(schema.trips)
        .set(updateData)
        .where(eq(schema.trips.id, id))
        .returning();

      const trip = tripResult[0];
      if (!trip) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update trip",
        });
      }

      // Delete existing destinations
      await ctx.db
        .delete(schema.tripDestinations)
        .where(eq(schema.tripDestinations.tripId, id));

      // Insert new destinations
      if (destinations.length > 0) {
        await ctx.db.insert(schema.tripDestinations).values(
          destinations.map((dest) => ({
            tripId: id,
            countryCode: dest.countryCode,
          })),
        );
      }

      return trip;
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
