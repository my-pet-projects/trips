import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const tripRouter = createTRPCRouter({
  getTrips: publicProcedure.query(async ({ ctx }) => {
    const trips = await ctx.db.query.trips.findMany();

    return trips ?? null;
  }),
});
