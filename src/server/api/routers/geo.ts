import { TRPCError } from "@trpc/server";
import { and, eq, gt, inArray, like, lt, ne } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { z } from "zod";

import { getNearbyPois } from "~/lib/geo/nearby-pois";
import { createLogger, errMsg } from "~/lib/logger";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import * as geoSchema from "~/server/db/geo-schema";

const log = createLogger("geo:poi");

export const geoRouter = createTRPCRouter({
  getCountries: publicProcedure.query(async ({ ctx }) => {
    const countries = await ctx.geoDb.query.countries.findMany({
      orderBy: [geoSchema.countries.name],
    });

    return countries;
  }),

  getCitiesByCountry: publicProcedure
    .input(
      z.object({
        countryCode: z.string().length(2).toUpperCase(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { countryCode, search } = input;

      const whereConditions = [eq(geoSchema.cities.countryCode, countryCode)];
      if (search) {
        whereConditions.push(like(geoSchema.cities.name, `%${search}%`));
      }

      const cities = await ctx.geoDb
        .select({
          id: geoSchema.cities.id,
          name: geoSchema.cities.name,
          countryCode: geoSchema.cities.countryCode,
          latitude: geoSchema.cities.latitude,
          longitude: geoSchema.cities.longitude,
        })
        .from(geoSchema.cities)
        .where(and(...whereConditions))
        .orderBy(geoSchema.cities.name)
        .limit(100);

      return cities;
    }),

  getNearestCities: publicProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        searchRadiusDegrees: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { latitude, longitude, searchRadiusDegrees: distance } = input;

      const cities = await ctx.geoDb
        .select({
          id: geoSchema.cities.id,
          name: geoSchema.cities.name,
          latitude: geoSchema.cities.latitude,
          longitude: geoSchema.cities.longitude,
          countryCode: geoSchema.cities.countryCode,
        })
        .from(geoSchema.cities)
        .where(
          and(
            gt(geoSchema.cities.latitude, latitude - distance),
            lt(geoSchema.cities.latitude, latitude + distance),
            gt(geoSchema.cities.longitude, longitude - distance),
            lt(geoSchema.cities.longitude, longitude + distance),
            ne(geoSchema.cities.latitude, latitude),
            ne(geoSchema.cities.longitude, longitude),
          ),
        )
        .orderBy(geoSchema.cities.name)
        .limit(20);

      return cities;
    }),

  getNearbyPois: publicProcedure
    .input(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        radiusMeters: z.number().min(50).max(1000).default(250),
        countryCode: z
          .string()
          .regex(/^[A-Za-z]{2}$/)
          .toUpperCase()
          .optional(),
      }),
    )
    .query(async ({ input }) => {
      try {
        return await getNearbyPois(
          input.latitude,
          input.longitude,
          input.radiusMeters,
          8,
          input.countryCode,
        );
      } catch (error) {
        log.error(
          { error: errMsg(error), input },
          "Failed to fetch nearby POIs",
        );
        const detail = errMsg(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: detail
            ? `Failed to fetch nearby places: ${detail}`
            : "Failed to fetch nearby places",
          cause: error,
        });
      }
    }),
});

export type EnrichedCity = {
  id: number;
  name: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  country: {
    cca2: string;
    cca3: string;
    name: string;
  };
};

export async function fetchCitiesWithCountries(
  geoDb: LibSQLDatabase<typeof geoSchema>,
  cityIds: number[],
) {
  if (cityIds.length === 0) return [];

  const cities = await geoDb
    .select({
      id: geoSchema.cities.id,
      name: geoSchema.cities.name,
      countryCode: geoSchema.cities.countryCode,
      latitude: geoSchema.cities.latitude,
      longitude: geoSchema.cities.longitude,
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
    .where(inArray(geoSchema.cities.id, cityIds));

  return cities;
}
