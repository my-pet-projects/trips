import { TRPCError } from "@trpc/server";
import { count, eq } from "drizzle-orm";
import { z } from "zod";

import { createLogger, errMsg } from "~/lib/logger";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import * as schema from "~/server/db/schema";

const log = createLogger("raw-attraction");

const emptyStatusCounts = () => ({ pending: 0, rejected: 0, duplicated: 0 });

const emptyHighlightCounts = () => ({
  must_see: 0,
  recommended: 0,
  skip: 0,
  none: 0,
});

export const rawAttractionRouter = createTRPCRouter({
  getTriageMapData: protectedProcedure
    .input(z.object({ countryCode: z.string().length(2) }))
    .query(async ({ ctx, input }) => {
      try {
        const [raw, existing, statusCountRows, highlightCountRows] = await Promise.all([
          ctx.db
            .select()
            .from(schema.rawAttractions)
            .where(eq(schema.rawAttractions.countryCode, input.countryCode))
            .orderBy(schema.rawAttractions.id),
          ctx.db
            .select()
            .from(schema.attractions)
            .where(eq(schema.attractions.countryCode, input.countryCode))
            .orderBy(schema.attractions.id),
          ctx.db
            .select({
              status: schema.rawAttractions.status,
              total: count(),
            })
            .from(schema.rawAttractions)
            .where(eq(schema.rawAttractions.countryCode, input.countryCode))
            .groupBy(schema.rawAttractions.status),
          ctx.db
            .select({
              highlight: schema.attractions.highlight,
              total: count(),
            })
            .from(schema.attractions)
            .where(eq(schema.attractions.countryCode, input.countryCode))
            .groupBy(schema.attractions.highlight),
        ]);

        const counts = emptyStatusCounts();
        for (const row of statusCountRows) {
          if (row.status === "pending") counts.pending = row.total;
          else if (row.status === "rejected") counts.rejected = row.total;
          else if (row.status === "duplicated") counts.duplicated = row.total;
        }

        const highlightCounts = emptyHighlightCounts();
        for (const row of highlightCountRows) {
          const key =
            row.highlight === "must_see" ||
            row.highlight === "recommended" ||
            row.highlight === "skip"
              ? row.highlight
              : "none";
          highlightCounts[key] = row.total;
        }

        return { raw, existing, counts, highlightCounts };
      } catch (error) {
        log.error(
          { countryCode: input.countryCode, error: errMsg(error) },
          "Error fetching triage map data",
        );
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch triage map data",
          cause: error,
        });
      }
    }),

  approve: protectedProcedure
    .input(
      z.object({
        id: z.number().min(1),
        highlight: z.enum(["must_see", "recommended", "skip"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const attraction = await ctx.db.transaction(async (tx) => {
          const raw = await tx.query.rawAttractions.findFirst({
            where: eq(schema.rawAttractions.id, input.id),
          });

          if (!raw) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Raw attraction not found",
            });
          }

          if (raw.status === "approved") {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Already approved",
            });
          }

          if (!raw.cityId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Cannot promote attraction without a city — coordinates may be missing",
            });
          }

          const [created] = await tx
            .insert(schema.attractions)
            .values({
              name: raw.name,
              nameLocal: raw.nameLocal ?? undefined,
              description: raw.description ?? undefined,
              latitude: raw.latitude ?? 0,
              longitude: raw.longitude ?? 0,
              sourceUrl: raw.sourceUrl ?? undefined,
              cityId: raw.cityId,
              countryCode: raw.countryCode,
              highlight: input.highlight,
              isVerified: false,
            })
            .returning();

          if (!created) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create attraction",
            });
          }

          const [updated] = await tx
            .update(schema.rawAttractions)
            .set({ status: "approved", attractionId: created.id })
            .where(eq(schema.rawAttractions.id, input.id))
            .returning({ id: schema.rawAttractions.id });

          if (!updated) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to mark raw attraction as approved",
            });
          }

          return created;
        });

        return { attraction };
      } catch (error) {
        log.error(
          { id: input.id, error: errMsg(error) },
          "Error approving raw attraction",
        );
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
      try {
        const [updated] = await ctx.db
          .update(schema.rawAttractions)
          .set({ status: "rejected" })
          .where(eq(schema.rawAttractions.id, input.id))
          .returning({ id: schema.rawAttractions.id });

        if (!updated) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Raw attraction not found",
          });
        }

        return { success: true };
      } catch (error) {
        log.error(
          { id: input.id, error: errMsg(error) },
          "Error rejecting raw attraction",
        );
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reject attraction",
          cause: error,
        });
      }
    }),

  markDuplicated: protectedProcedure
    .input(z.object({ id: z.number().min(1) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const [updated] = await ctx.db
          .update(schema.rawAttractions)
          .set({ status: "duplicated" })
          .where(eq(schema.rawAttractions.id, input.id))
          .returning({ id: schema.rawAttractions.id });

        if (!updated) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Raw attraction not found",
          });
        }

        return { success: true };
      } catch (error) {
        log.error(
          { id: input.id, error: errMsg(error) },
          "Error marking raw attraction as duplicated",
        );
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to mark attraction as duplicated",
          cause: error,
        });
      }
    }),
});
