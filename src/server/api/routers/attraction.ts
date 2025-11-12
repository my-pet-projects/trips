import { TRPCError } from "@trpc/server";
import { and, count, eq, inArray, like, or } from "drizzle-orm";
import z from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import * as geoSchema from "~/server/db/geo-schema";
import * as schema from "~/server/db/schema";

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
        console.error("Error fetching attraction by ID:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch attraction",
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

        const cities =
          cityIds.length > 0
            ? await ctx.geoDb
                .select({
                  id: geoSchema.cities.id,
                  name: geoSchema.cities.name,
                  countryCode: geoSchema.cities.countryCode,
                  country: {
                    cca2: geoSchema.countries.cca2,
                    cca3: geoSchema.countries.cca3,
                    name: geoSchema.countries.name,
                  },
                })
                .from(geoSchema.cities)
                .innerJoin(
                  geoSchema.countries,
                  eq(geoSchema.cities.countryCode, geoSchema.countries.cca2),
                )
                .where(inArray(geoSchema.cities.id, cityIds))
            : [];

        const cityMap = new Map(cities.map((city) => [city.id, city]));

        const enrichedAttractions = attractions
          .map((attraction) => {
            const cityData = cityMap.get(attraction.cityId);
            if (!cityData) {
              console.warn(
                `Attraction ${attraction.id} references non-existent city ${attraction.cityId}`,
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
      } catch (error) {
        console.error("Error fetching attractions by countries:", error);
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

        const cities =
          cityIds.length > 0
            ? await ctx.geoDb
                .select({
                  id: geoSchema.cities.id,
                  name: geoSchema.cities.name,
                  countryCode: geoSchema.cities.countryCode,
                  country: {
                    cca2: geoSchema.countries.cca2,
                    cca3: geoSchema.countries.cca3,
                    name: geoSchema.countries.name,
                  },
                })
                .from(geoSchema.cities)
                .innerJoin(
                  geoSchema.countries,
                  eq(geoSchema.cities.countryCode, geoSchema.countries.cca2),
                )
                .where(inArray(geoSchema.cities.id, cityIds))
            : [];

        const cityMap = new Map(cities.map((city) => [city.id, city]));

        const enrichedAttractions = attractions
          .map((attraction) => {
            const cityData = cityMap.get(attraction.cityId);
            if (!cityData) {
              console.warn(
                `Attraction ${attraction.id} references non-existent city ${attraction.cityId}`,
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

        return {
          attractions: enrichedAttractions,
          pagination: {
            limit,
            offset,
            total: rowCount?.count ?? 0,
          },
        };
      } catch (error) {
        console.error("Error fetching attractions:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch attractions",
          cause: error,
        });
      }
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1, "Name is required").max(256),
        nameLocal: z.string().max(256).optional(),
        description: z.string().optional(),
        address: z.string().max(256).optional(),
        latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
        longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
        sourceUrl: z.string().max(256).optional().nullable(),
        cityId: z.number().min(1, "City is required"),
        countryCode: z.string().length(2, "Country is required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const existing = await ctx.db.query.attractions.findFirst({
        where: eq(schema.attractions.id, id),
      });

      if (!existing) {
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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update attraction",
        });
      }

      return result[0];
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required").max(256),
        nameLocal: z.string().max(256).optional(),
        description: z.string().optional(),
        address: z.string().max(256).optional(),
        latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
        longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
        sourceUrl: z.string().max(256).optional().nullable(),
        cityId: z.number().min(1, "City is required"),
        countryCode: z.string().length(2, "Country is required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { ...createData } = input;

      const result = await ctx.db
        .insert(schema.attractions)
        .values(createData)
        .returning();

      if (!result[0]) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create attraction",
        });
      }

      return result[0];
    }),
});
