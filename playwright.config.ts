import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "html",
  expect: {
    timeout: 60000,
  },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    ...(bypassSecret && {
      extraHTTPHeaders: {
        "x-vercel-protection-bypass": bypassSecret,
      },
    }),
  },
  projects: [
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: [/global\.setup\.ts/, /.*\.auth\.spec\.ts/],
    },
    {
      name: "chromium-authenticated",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /.*\.auth\.spec\.ts/,
      dependencies: ["setup"],
    },
  ],
  ...(process.env.PLAYWRIGHT_BASE_URL
    ? {}
    : {
        webServer: {
          command: "pnpm dev",
          url: "http://localhost:3000",
          reuseExistingServer: !process.env.CI,
          timeout: 120 * 1000,
        },
      }),
});
