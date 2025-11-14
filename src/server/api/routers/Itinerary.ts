import { TRPCError } from "@trpc/server";
import { eq, inArray } from "drizzle-orm";
import z from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import * as schema from "~/server/db/schema";

export const itineraryRouter = createTRPCRouter({
  createItineraryDay: publicProcedure
    .input(
      z.object({
        tripId: z.number(),
        name: z.string().min(1).max(100),
        dayNumber: z.number().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.trips.findFirst({
        where: eq(schema.trips.id, input.tripId),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trip not found",
        });
      }

      const result = await ctx.db
        .insert(schema.itineraryDays)
        .values(input)
        .returning();

      if (!result[0]) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create itinerary day",
        });
      }

      return result[0];
    }),

  deleteItineraryDay: publicProcedure
    .input(
      z.object({
        dayId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { dayId } = input;

      const existing = await ctx.db.query.itineraryDays.findFirst({
        where: eq(schema.itineraryDays.id, dayId),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Itinerary day not found",
        });
      }

      await ctx.db
        .delete(schema.itineraryDays)
        .where(eq(schema.itineraryDays.id, dayId));

      return { success: true, deletedId: dayId };
    }),

  updateItineraryDays: publicProcedure
    .input(
      z.object({
        tripId: z.number(),
        days: z.array(
          z.object({
            id: z.number(),
            name: z.string().min(1).max(100),
            dayNumber: z.number().min(1),
            attractions: z.array(
              z.object({
                attractionId: z.number(),
                order: z.number().min(1),
              }),
            ),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tripId, days } = input;

      const existing = await ctx.db.query.trips.findFirst({
        where: eq(schema.trips.id, tripId),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trip not found",
        });
      }

      try {
        await ctx.db.transaction(async (tx) => {
          // Update all day metadata
          for (const day of days) {
            await tx
              .update(schema.itineraryDays)
              .set({
                name: day.name,
                dayNumber: day.dayNumber,
              })
              .where(eq(schema.itineraryDays.id, day.id));
          }

          // Delete all existing places for these days
          const dayIds = days.map((d) => d.id);
          await tx
            .delete(schema.itineraryDayPlaces)
            .where(inArray(schema.itineraryDayPlaces.itineraryDayId, dayIds));

          // Insert all new places
          const allPlaces = days.flatMap((day) =>
            day.attractions.map((attr) => ({
              itineraryDayId: day.id,
              attractionId: attr.attractionId,
              order: attr.order,
            })),
          );

          if (allPlaces.length > 0) {
            await tx.insert(schema.itineraryDayPlaces).values(allPlaces);
          }
        });

        return {
          success: true,
          updatedCount: days.length,
        };
      } catch (error) {
        console.error("Error updating itinerary days:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update itinerary days",
          cause: error,
        });
      }
    }),
});
