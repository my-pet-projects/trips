import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { buildChainResponse } from "~/server/routing/build-chain-response";
import { loadTripChains } from "~/server/routing/load-trip-chains";
import { resolveChains } from "~/server/routing/resolve-leg";

export const routeRouter = createTRPCRouter({
  forTrip: publicProcedure
    .input(z.object({ tripId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const { blockChains, overnightLegs } = await loadTripChains(
        ctx.db,
        input.tripId,
      );

      const [blockResults, overnightResults] = await Promise.all([
        resolveChains(
          ctx.db,
          blockChains.map((chain) => chain.points),
        ),
        resolveChains(
          ctx.db,
          overnightLegs.map((leg) => leg.points),
        ),
      ]);

      return {
        blocks: blockChains.map((chain, i) => {
          const { legs, error } = blockResults[i]!;
          return {
            blockId: chain.blockId,
            route: error ? null : buildChainResponse(legs),
            error,
          };
        }),
        overnight: overnightLegs.map((leg, i) => {
          const { legs, error } = overnightResults[i]!;
          return {
            blockId: leg.blockId,
            kind: leg.kind,
            stopId: leg.stopId,
            attractionId: leg.attractionId,
            data: legs[0]?.data ?? null,
            error,
          };
        }),
      };
    }),
});
