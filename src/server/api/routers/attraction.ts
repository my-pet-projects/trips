import { and, count, eq, inArray, like, or } from "drizzle-orm";
import z from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import * as geoSchema from "~/server/db/geo-schema";
import * as schema from "~/server/db/schema";

export const attractionRouter = createTRPCRouter({
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
    }),
});
