import { TRPCError } from "@trpc/server";
import { and, count, eq, inArray, like, or, sql } from "drizzle-orm";
import z from "zod";

import { createLogger, errMsg } from "~/lib/logger";
import {
  attractionCreateInputSchema,
  attractionHighlightSchema,
  attractionUpdateInputSchema,
} from "~/lib/validators/attraction";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import * as geoSchema from "~/server/db/geo-schema";
import * as schema from "~/server/db/schema";
import { fetchCitiesWithCountries, type EnrichedCity } from "./geo";

const log = createLogger("attraction");

export const attractionRouter = createTRPCRouter({
  getAttractionById: publicProcedure
    .input(z.object({ id: z.number().min(1) }))
    .query(async ({ ctx, input }) => {
      try {
        const attraction = await ctx.db
          .select()
          .from(schema.attractions)
          .where(eq(schema.attractions.id, input.id))
          .limit(1)
          .then((rows) => rows[0]);

        if (!attraction) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Attraction with ID ${input.id} not found`,
          });
        }

        const cities = await fetchCitiesWithCountries(ctx.geoDb, [attraction.cityId]);
        const city = cities[0];

        if (!city) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `City with ID ${attraction.cityId} not found for attraction ${input.id}`,
          });
        }

        return { ...attraction, city };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        log.error(
          { id: input.id, error: errMsg(error) },
          "Error fetching attraction by ID",
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch attraction",
          cause: error,
        });
      }
    }),

  getAllAttractions: publicProcedure.query(async ({ ctx }) => {
    try {
      const attractions = await ctx.db
        .select({
          id: schema.attractions.id,
          name: schema.attractions.name,
          nameLocal: schema.attractions.nameLocal,
          description: schema.attractions.description,
          latitude: schema.attractions.latitude,
          longitude: schema.attractions.longitude,
          highlight: schema.attractions.highlight,
          isVerified: schema.attractions.isVerified,
          sourceUrl: schema.attractions.sourceUrl,
          cityId: schema.attractions.cityId,
          countryCode: schema.attractions.countryCode,
        })
        .from(schema.attractions)
        .orderBy(schema.attractions.id);

      return attractions;
    } catch (error) {
      log.error({ error: errMsg(error) }, "Error fetching attractions");
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch attractions",
        cause: error,
      });
    }
  }),

  getAttractionsByCountries: publicProcedure
    .input(z.object({ countryCodes: z.array(z.string().length(2)).min(1) }))
    .query(async ({ ctx, input }) => {
      try {
        const attractions = await ctx.db
          .select()
          .from(schema.attractions)
          .where(inArray(schema.attractions.countryCode, input.countryCodes))
          .orderBy(schema.attractions.id);

        const cityIds = [
          ...new Set(attractions.map((attraction) => attraction.cityId)),
        ];
        const cities = await fetchCitiesWithCountries(ctx.geoDb, cityIds);
        const enrichedAttractions = enrichAttractionsWithCities(
          attractions,
          cities,
        );

        return enrichedAttractions;
      } catch (error) {
        log.error(
          { countryCodes: input.countryCodes, error: errMsg(error) },
          "Error fetching attractions by countries",
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch attractions",
          cause: error,
        });
      }
    }),

  getVerificationQueue: protectedProcedure
    .input(
      z.object({
        countryCode: z
          .string()
          .length(2)
          .transform((value) => value.toUpperCase()),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const rows = await ctx.db
          .select({
            id: schema.attractions.id,
            name: schema.attractions.name,
            nameLocal: schema.attractions.nameLocal,
            highlight: schema.attractions.highlight,
          })
          .from(schema.attractions)
          .where(
            and(
              eq(schema.attractions.countryCode, input.countryCode),
              eq(schema.attractions.isVerified, false),
            ),
          )
          .orderBy(
            sql`CASE ${schema.attractions.highlight} WHEN 'must_see' THEN 0 WHEN 'recommended' THEN 1 WHEN 'skip' THEN 2 ELSE 3 END`,
            sql`CASE WHEN ${schema.attractions.latitude} IS NULL OR ${schema.attractions.longitude} IS NULL THEN 1 ELSE 0 END`,
            schema.attractions.id,
          );

        return {
          countryCode: input.countryCode,
          total: rows.length,
          items: rows,
          ids: rows.map((row) => row.id),
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        log.error(
          { countryCode: input.countryCode, error: errMsg(error) },
          "Error fetching verification queue",
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch verification queue",
          cause: error,
        });
      }
    }),

  paginateAttractions: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(10),
          offset: z.number().min(0).default(0),
          search: z.string().optional(),
          country: z.string().length(2).optional(),
          city: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      try {
        const { limit = 10, offset = 0, search, country, city } = input ?? {};

        let cityId: number | undefined;
        if (city) {
          const cityConditions = [eq(geoSchema.cities.name, city)];
          if (country) {
            cityConditions.push(eq(geoSchema.cities.countryCode, country));
          }

          const [cityData] = await ctx.geoDb
            .select({ id: geoSchema.cities.id })
            .from(geoSchema.cities)
            .where(and(...cityConditions))
            .limit(1);

          cityId = cityData?.id;
          if (!cityId) {
            return {
              attractions: [],
              pagination: {
                limit,
                offset,
                total: 0,
              },
            };
          }
        }

        const conditions = [];
        if (search) {
          conditions.push(
            or(
              like(schema.attractions.name, `%${search}%`),
              like(schema.attractions.nameLocal, `%${search}%`),
            ),
          );
        }
        if (country) {
          conditions.push(eq(schema.attractions.countryCode, country));
        }
        if (cityId) {
          conditions.push(eq(schema.attractions.cityId, cityId));
        }

        const whereClause =
          conditions.length > 0 ? and(...conditions) : undefined;

        const [rowCount] = await ctx.db
          .select({ count: count() })
          .from(schema.attractions)
          .where(whereClause);

        const attractions = await ctx.db
          .select()
          .from(schema.attractions)
          .where(whereClause)
          .orderBy(schema.attractions.id)
          .limit(limit)
          .offset(offset);

        const cityIds = [
          ...new Set(attractions.map((attraction) => attraction.cityId)),
        ];
        const cities = await fetchCitiesWithCountries(ctx.geoDb, cityIds);
        const enrichedAttractions = enrichAttractionsWithCities(
          attractions,
          cities,
        );

        return {
          attractions: enrichedAttractions,
          pagination: {
            limit,
            offset,
            total: rowCount?.count ?? 0,
          },
        };
      } catch (error) {
        log.error({ error: errMsg(error) }, "Error paginating attractions");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch attractions",
          cause: error,
        });
      }
    }),

  updateHighlight: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        highlight: attractionHighlightSchema.nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(schema.attractions)
        .set({ highlight: input.highlight })
        .where(eq(schema.attractions.id, input.id))
        .returning();

      if (!result[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Attraction not found" });
      }
      return result[0];
    }),

  update: protectedProcedure
    .input(attractionUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const existing = await ctx.db.query.attractions.findFirst({
        where: eq(schema.attractions.id, id),
      });

      if (!existing) {
        log.warn({ id }, "Attraction not found for update");
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Attraction not found",
        });
      }

      const result = await ctx.db
        .update(schema.attractions)
        .set({
          ...updateData,
        })
        .where(eq(schema.attractions.id, id))
        .returning();

      if (!result[0]) {
        log.error({ id }, "Failed to update attraction");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update attraction",
        });
      }

      return result[0];
    }),

  create: protectedProcedure
    .input(attractionCreateInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.db
          .insert(schema.attractions)
          .values(input)
          .returning();

        if (!result[0]) {
          log.error(
            { input },
            "Failed to create attraction - no result returned",
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create attraction",
          });
        }

        return result[0];
      } catch (error) {
        log.error({ error: errMsg(error) }, "Error creating attraction");
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create attraction",
          cause: error,
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.attractions.findFirst({
        where: eq(schema.attractions.id, input.id),
      });

      if (!existing) {
        log.warn({ id: input.id }, "Attraction not found for deletion");
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Attraction with ID ${input.id} not found`,
        });
      }

      try {
        await ctx.db
          .delete(schema.attractions)
          .where(eq(schema.attractions.id, input.id))
          .returning();

        return { success: true };
      } catch (error) {
        log.error(
          { id: input.id, error: errMsg(error) },
          "Error deleting attraction",
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete attraction",
          cause: error,
        });
      }
    }),
});

function enrichAttractionsWithCities<T extends { cityId: number }>(
  attractions: T[],
  cities: EnrichedCity[],
) {
  const cityMap = new Map(cities.map((city) => [city.id, city]));

  const enrichedAttractions = attractions
    .map((attraction) => {
      const cityData = cityMap.get(attraction.cityId);
      if (!cityData) {
        log.warn(
          { cityId: attraction.cityId },
          "Attraction references non-existent city",
        );
        return null;
      }
      return {
        ...attraction,
        city: cityData,
      };
    })
    .filter(
      (attraction): attraction is NonNullable<typeof attraction> =>
        attraction !== null,
    );

  return enrichedAttractions;
}
