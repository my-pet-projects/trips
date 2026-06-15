import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { createLogger, errMsg } from "~/lib/logger";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import * as geoSchema from "~/server/db/geo-schema";
import * as schema from "~/server/db/schema";

const log = createLogger("raw-attraction");

export const rawAttractionRouter = createTRPCRouter({
  getByCountry: protectedProcedure
    .input(z.object({ countryCode: z.string().length(2) }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(schema.rawAttractions)
        .where(eq(schema.rawAttractions.countryCode, input.countryCode))
        .orderBy(schema.rawAttractions.id);

      return rows;
    }),

  getExistingByCountry: protectedProcedure
    .input(z.object({ countryCode: z.string().length(2) }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(schema.attractions)
        .where(eq(schema.attractions.countryCode, input.countryCode))
        .orderBy(schema.attractions.id);

      return rows;
    }),

  approve: protectedProcedure
    .input(z.object({ id: z.number().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const raw = await ctx.db.query.rawAttractions.findFirst({
        where: eq(schema.rawAttractions.id, input.id),
      });

      if (!raw) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Raw attraction not found" });
      }

      if (!raw.cityId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot promote attraction without a city — coordinates may be missing",
        });
      }

      const cityId = raw.cityId;

      try {
        const attraction = await ctx.db.transaction(async (tx) => {
          const [created] = await tx
            .insert(schema.attractions)
            .values({
              name: raw.name,
              nameLocal: raw.nameLocal ?? undefined,
              description: raw.description ?? undefined,
              latitude: raw.latitude ?? undefined,
              longitude: raw.longitude ?? undefined,
              sourceUrl: raw.sourceUrl ?? undefined,
              cityId,
              countryCode: raw.countryCode,
              isVerified: false,
            })
            .returning();

          if (!created) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create attraction" });
          }

          await tx
            .update(schema.rawAttractions)
            .set({ status: "approved", attractionId: created.id })
            .where(eq(schema.rawAttractions.id, input.id));

          return created;
        });

        return { attraction };
      } catch (error) {
        log.error({ id: input.id, error: errMsg(error) }, "Error approving raw attraction");
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to approve attraction",
          cause: error,
        });
      }
    }),

  reject: protectedProcedure
    .input(z.object({ id: z.number().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(schema.rawAttractions)
        .set({ status: "rejected" })
        .where(eq(schema.rawAttractions.id, input.id))
        .returning({ id: schema.rawAttractions.id });

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Raw attraction not found" });
      }

      return { success: true };
    }),

  markDuplicated: protectedProcedure
    .input(z.object({ id: z.number().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(schema.rawAttractions)
        .set({ status: "duplicated" })
        .where(eq(schema.rawAttractions.id, input.id))
        .returning({ id: schema.rawAttractions.id });

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Raw attraction not found" });
      }

      return { success: true };
    }),
});
