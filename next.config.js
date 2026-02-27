/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // Disable default request logging since we use pino for structured logs
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default config;
