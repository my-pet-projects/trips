import { TRPCError } from "@trpc/server";
import { eq, inArray } from "drizzle-orm";
import z from "zod";

import { createLogger, errMsg } from "~/lib/logger";
import { fetchAttractionsByCountryCodes, enrichAttractionsWithCityData } from "~/server/api/routers/attraction";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { tripCreateSchema, tripUpdateSchema } from "~/server/api/schemas/trip";
import * as geoSchema from "~/server/db/geo-schema";
import * as schema from "~/server/db/schema";

const log = createLogger("trip");

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
            log.warn(
              { destId: dest.id, countryCode: dest.countryCode },
              "Destination references non-existent country",
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
          overnightStops: {
            orderBy: (stop, { asc }) => [asc(stop.checkInDate)],
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

  getWithItinerary: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const trip = await ctx.db.query.trips.findFirst({
        where: eq(schema.trips.id, input.id),
        with: {
          destinations: true,
          itineraryDays: {
            orderBy: (day, { asc }) => [asc(day.dayNumber)],
            with: {
              itineraryDayPlaces: {
                orderBy: (place, { asc }) => [asc(place.order)],
                with: {
                  attraction: true,
                },
              },
            },
          },
        },
      });

      if (!trip) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trip not found",
        });
      }

      return {
        ...trip,
        itineraryDays: trip.itineraryDays.map(
          ({ id, name, dayNumber, itineraryDayPlaces }) => ({
            id,
            name,
            dayNumber,
            attractions: itineraryDayPlaces.map((place) => place.attraction),
          }),
        ),
      };
    }),

  getItineraryViewData: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const destinations = await ctx.db.query.tripDestinations.findMany({
        where: eq(schema.tripDestinations.tripId, input.id),
      });

      const countryCodes = [
        ...new Set(destinations.map((destination) => destination.countryCode)),
      ];

      const [trip, attractions] = await Promise.all([
        ctx.db.query.trips.findFirst({
          where: eq(schema.trips.id, input.id),
          with: {
            destinations: true,
            itineraryDays: {
              orderBy: (day, { asc }) => [asc(day.dayNumber)],
              with: {
                itineraryDayPlaces: {
                  orderBy: (place, { asc }) => [asc(place.order)],
                  with: {
                    attraction: true,
                  },
                },
              },
            },
          },
        }),
        fetchAttractionsByCountryCodes(ctx, countryCodes),
      ]);

      if (!trip) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trip not found",
        });
      }

      return {
        trip: {
          ...trip,
          itineraryDays: trip.itineraryDays.map(
            ({ id, name, dayNumber, itineraryDayPlaces }) => ({
              id,
              name,
              dayNumber,
              attractions: itineraryDayPlaces.map((place) => place.attraction),
            }),
          ),
        },
        attractions,
      };
    }),

  getTripViewData: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const trip = await ctx.db.query.trips.findFirst({
        where: eq(schema.trips.id, input.id),
        with: {
          destinations: true,
          itineraryDays: {
            orderBy: (day, { asc }) => [asc(day.dayNumber)],
            with: {
              itineraryDayPlaces: {
                orderBy: (place, { asc }) => [asc(place.order)],
                with: {
                  attraction: true,
                },
              },
            },
          },
        },
      });

      if (!trip) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trip not found",
        });
      }

      const attractionsById = new Map<
        number,
        (typeof trip.itineraryDays)[number]["itineraryDayPlaces"][number]["attraction"]
      >();
      for (const day of trip.itineraryDays) {
        for (const place of day.itineraryDayPlaces) {
          attractionsById.set(place.attraction.id, place.attraction);
        }
      }

      const attractions = await enrichAttractionsWithCityData(ctx, [
        ...attractionsById.values(),
      ]);

      return {
        trip: {
          ...trip,
          itineraryDays: trip.itineraryDays.map(
            ({ id, name, dayNumber, itineraryDayPlaces }) => ({
              id,
              name,
              dayNumber,
              attractions: itineraryDayPlaces.map((place) => place.attraction),
            }),
          ),
        },
        attractions,
      };
    }),

  create: protectedProcedure
    .input(tripCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { destinations, ...tripData } = input;

      try {
        return await ctx.db.transaction(async (tx) => {
          const tripResult = await tx
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

          if (destinations.length > 0) {
            await tx.insert(schema.tripDestinations).values(
              destinations.map((dest) => ({
                tripId: trip.id,
                countryCode: dest.countryCode,
              })),
            );
          }

          return trip;
        });
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        log.error({ error: errMsg(error) }, "Failed to create trip");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create trip",
          cause: error,
        });
      }
    }),

  update: protectedProcedure
    .input(tripUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, destinations, overnightStops, ...updateData } = input;

      const existing = await ctx.db.query.trips.findFirst({
        where: eq(schema.trips.id, id),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trip not found",
        });
      }

      try {
        return await ctx.db.transaction(async (tx) => {
          const tripResult = await tx
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

          await tx
            .delete(schema.tripDestinations)
            .where(eq(schema.tripDestinations.tripId, id));

          if (destinations.length > 0) {
            await tx.insert(schema.tripDestinations).values(
              destinations.map((dest) => ({
                tripId: id,
                countryCode: dest.countryCode,
              })),
            );
          }

          await tx
            .delete(schema.tripOvernightStops)
            .where(eq(schema.tripOvernightStops.tripId, id));

          if (overnightStops.length > 0) {
            const sortedStops = [...overnightStops].sort(
              (a, b) => a.checkInDate.getTime() - b.checkInDate.getTime(),
            );

            await tx.insert(schema.tripOvernightStops).values(
              sortedStops.map((stop) => ({
                tripId: id,
                name: stop.name,
                address: stop.address,
                latitude: stop.latitude,
                longitude: stop.longitude,
                checkInDate: stop.checkInDate,
                checkOutDate: stop.checkOutDate,
              })),
            );
          }

          return trip;
        });
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        log.error({ id, error: errMsg(error) }, "Failed to update trip");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update trip",
          cause: error,
        });
      }
    }),

  deleteTrip: protectedProcedure
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
