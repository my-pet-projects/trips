import { TRPCError } from "@trpc/server";
import { eq, inArray } from "drizzle-orm";
import z from "zod";

import { createLogger, errMsg } from "~/lib/logger";
import {
  createPlanBlockInputSchema,
  updatePlanBlocksInputSchema,
} from "~/server/api/schemas/itinerary";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import * as schema from "~/server/db/schema";

const log = createLogger("itinerary");

export const itineraryRouter = createTRPCRouter({
  createPlanBlock: protectedProcedure
    .input(createPlanBlockInputSchema)
    .mutation(async ({ ctx, input }) => {
      const trip = await ctx.db.query.trips.findFirst({
        where: eq(schema.trips.id, input.tripId),
      });

      if (!trip) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trip not found",
        });
      }

      try {
        const result = await ctx.db
          .insert(schema.planBlocks)
          .values({
            tripId: input.tripId,
            name: input.name,
            blockNumber: input.blockNumber,
            pinnedStartDate: input.pinnedStartDate,
            pinnedEndDate: input.pinnedEndDate,
          })
          .returning();

        if (!result[0]) {
          log.error(
            { tripId: input.tripId },
            "Failed to create plan block - no result returned",
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create plan block",
          });
        }

        return result[0];
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        log.error(
          { tripId: input.tripId, error: errMsg(error) },
          "Error creating plan block",
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create plan block",
          cause: error,
        });
      }
    }),

  deletePlanBlock: protectedProcedure
    .input(
      z.object({
        blockId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { blockId } = input;

      const existing = await ctx.db.query.planBlocks.findFirst({
        where: eq(schema.planBlocks.id, blockId),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plan block not found",
        });
      }

      await ctx.db
        .delete(schema.planBlocks)
        .where(eq(schema.planBlocks.id, blockId));

      return { success: true, deletedId: blockId };
    }),

  updatePlanBlocks: protectedProcedure
    .input(updatePlanBlocksInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { tripId, blocks } = input;

      const trip = await ctx.db.query.trips.findFirst({
        where: eq(schema.trips.id, tripId),
      });

      if (!trip) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trip not found",
        });
      }

      const allowedBlocks = await ctx.db.query.planBlocks.findMany({
        where: eq(schema.planBlocks.tripId, tripId),
      });

      const allowedBlockIds = new Set(allowedBlocks.map((block) => block.id));

      for (const block of blocks) {
        if (!allowedBlockIds.has(block.id)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Plan block ${block.id} does not belong to trip ${tripId}`,
          });
        }
      }

      try {
        await ctx.db.transaction(async (tx) => {
          const tempOffset = 10_000;
          for (const block of blocks) {
            await tx
              .update(schema.planBlocks)
              .set({ blockNumber: block.blockNumber + tempOffset })
              .where(eq(schema.planBlocks.id, block.id));
          }

          for (const block of blocks) {
            await tx
              .update(schema.planBlocks)
              .set({
                name: block.name,
                blockNumber: block.blockNumber,
                pinnedStartDate: block.pinnedStartDate,
                pinnedEndDate: block.pinnedEndDate,
              })
              .where(eq(schema.planBlocks.id, block.id));
          }

          const blockIds = blocks.map((block) => block.id);
          if (blockIds.length > 0) {
            await tx
              .delete(schema.planBlockPlaces)
              .where(inArray(schema.planBlockPlaces.planBlockId, blockIds));
          }

          const allPlaces = blocks.flatMap((block) =>
            block.attractions.map((attr) => ({
              planBlockId: block.id,
              attractionId: attr.attractionId,
              order: attr.order,
            })),
          );

          if (allPlaces.length > 0) {
            await tx.insert(schema.planBlockPlaces).values(allPlaces);
          }
        });

        return {
          success: true,
          updatedCount: blocks.length,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        log.error(
          { tripId: input.tripId, error: errMsg(error) },
          "Error updating plan blocks",
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update plan blocks",
          cause: error,
        });
      }
    }),
});
