import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

import { attractionRouter } from "./routers/attraction";
import { attractionScraperRouter } from "./routers/attraction-scraper";
import { geoRouter } from "./routers/geo";
import { itineraryRouter } from "./routers/itinerary";
import { rawAttractionRouter } from "./routers/raw-attraction";
import { routeRouter } from "./routers/route";
import { tripRouter } from "./routers/trip";

export const appRouter = createTRPCRouter({
  geo: geoRouter,
  trip: tripRouter,
  attraction: attractionRouter,
  attractionScraper: attractionScraperRouter,
  itinerary: itineraryRouter,
  route: routeRouter,
  rawAttraction: rawAttractionRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
