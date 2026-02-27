import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";

import { env } from "~/env";
import { createLogger } from "~/lib/logger";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

const log = createLogger("trpc:http");

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
  return createTRPCContext({
    headers: req.headers,
  });
};

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError: ({ path, error, type }) => {
      log.error(
        {
          path,
          type,
          code: error.code,
          message: error.message,
          cause: error.cause instanceof Error ? error.cause.message : undefined,
          stack: env.NODE_ENV === "development" ? error.stack : undefined,
        },
        `tRPC error on ${path ?? "<no-path>"}`,
      );
    },
  });

export { handler as GET, handler as POST };
