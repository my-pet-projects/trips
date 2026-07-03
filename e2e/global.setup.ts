import fs from "node:fs";
import path from "node:path";

import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { expect, test as setup } from "@playwright/test";

import { assertClerkAuthEnv, clerkAuthFile } from "./clerk-auth";

setup.describe.configure({ mode: "serial" });

setup("prepare Clerk auth for E2E", async ({ page }) => {
  assertClerkAuthEnv();

  await clerkSetup();

  await page.goto("/");
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: process.env.E2E_CLERK_USER_USERNAME!,
      password: process.env.E2E_CLERK_USER_PASSWORD!,
    },
  });

  // Confirm protected API calls work (raw triage markers depend on this).
  await page.goto("/attractions/raw?country=FR");
  await page.waitForLoadState("domcontentloaded");
  await expect(page.getByText("Not authenticated")).not.toBeVisible({ timeout: 15000 });

  fs.mkdirSync(path.dirname(clerkAuthFile), { recursive: true });
  await page.context().storageState({ path: clerkAuthFile });
});
