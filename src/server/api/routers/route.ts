import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { buildChainResponse } from "~/server/routing/build-chain-response";
import { loadTripChains } from "~/server/routing/load-trip-chains";
import { resolveChains } from "~/server/routing/resolve-leg";

export const routeRouter = createTRPCRouter({
  forTrip: publicProcedure
    .input(z.object({ tripId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const { blockChains, connectors } = await loadTripChains(
        ctx.db,
        input.tripId,
      );

      const [blockResults, connectorResults] = await Promise.all([
        resolveChains(
          ctx.db,
          blockChains.map((chain) => chain.points),
        ),
        resolveChains(
          ctx.db,
          connectors.map((connector) => connector.points),
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
        connectors: connectors.map((connector, i) => {
          const { legs, error } = connectorResults[i]!;
          return {
            label: connector.label,
            attachTo: connector.attachTo,
            data: legs[0]?.data ?? null,
            error,
          };
        }),
      };
    }),
});
