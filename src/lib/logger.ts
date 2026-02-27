import pino from "pino";
import { env, isProd } from "~/env";

const isDevelopment = !isProd;

/**
 * Application logger using pino
 *
 * - In development: Pretty colored output with timestamps, minimal metadata
 * - In production (Vercel): Structured JSON logs that Vercel parses automatically
 *
 * Usage:
 *   import { logger } from "~/lib/logger";
 *   logger.info("User logged in", { userId: "123" });
 *   logger.error("Failed to fetch data", { error: err.message });
 */
export const logger = pino({
  level: env.LOG_LEVEL ?? "info",
  ...(isDevelopment
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname,requestId,userId,userAgent,ip",
            messageFormat: "{context} {msg}",
          },
        },
      }
    : {
        // Production: JSON logs for Vercel
        formatters: {
          level: (label) => ({ level: label }),
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      }),
});

/**
 * Create a child logger with a specific context
 * Useful for adding consistent metadata to all logs in a module
 *
 * Usage:
 *   const log = createLogger("api/attractions");
 *   log.info("Fetching attractions");
 */
export function createLogger(context: string) {
  return logger.child({ context });
}

/**
 * Extract error message from unknown error type
 * Usage: log.error({ error: errMsg(e) }, "Something failed")
 */
export function errMsg(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// Re-export types for convenience
export type Logger = pino.Logger;
