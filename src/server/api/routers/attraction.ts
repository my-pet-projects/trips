import { TRPCError } from "@trpc/server";
import { and, count, eq, inArray, like, or } from "drizzle-orm";
import z from "zod";

import { createLogger, errMsg } from "~/lib/logger";
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

        const [cityData] =
          (await ctx.geoDb
            .select()
            .from(geoSchema.cities)
            .where(eq(geoSchema.cities.id, attraction.cityId))
            .limit(1)) ?? [];

        if (!cityData) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `City with ID ${attraction.cityId} not found for attraction ${input.id}`,
          });
        }

        return {
          ...attraction,
          city: cityData,
        };
      } catch (error) {
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
        .select()
        .from(schema.attractions)
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

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1, "Name is required").max(256).trim(),
        nameLocal: z.string().max(256).optional(),
        description: z.string().optional(),
        latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
        longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
        sourceUrl: z.string().max(256).optional().nullable(),
        cityId: z.number().min(1, "City is required"),
        countryCode: z.string().length(2, "Country is required"),
        isVerified: z.boolean().optional(),
      }),
    )
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
    .input(
      z.object({
        name: z.string().min(1, "Name is required").max(256).trim(),
        nameLocal: z.string().max(256).optional(),
        description: z.string().optional(),
        latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
        longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
        sourceUrl: z.string().max(256).optional().nullable(),
        cityId: z.number().min(1, "City is required"),
        countryCode: z.string().length(2, "Country is required"),
        isVerified: z.boolean().optional(),
      }),
    )
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
