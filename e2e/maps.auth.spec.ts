import { expect, test } from "@playwright/test";

import { assertClerkAuthEnv, clerkAuthFile } from "./clerk-auth";
import {
  clickFirstMapTarget,
  desktopFilterBar,
  hasMapTargets,
  LEAFLET_CONTAINER,
  waitForLeafletMap,
} from "./maps.helpers";

assertClerkAuthEnv();

test.use({ storageState: clerkAuthFile });

test.describe("Raw triage map", () => {
  test.setTimeout(120000);

  test("loads map for a country and opens triage panel on marker click", async ({ page }) => {
    await page.goto("/attractions/raw?country=FR");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByTestId("raw-map-view")).toBeVisible();
    await expect(page.getByText("Not authenticated")).not.toBeVisible({ timeout: 15000 });
    await waitForLeafletMap(page);

    if (!(await hasMapTargets(page))) {
      test.skip(true, "No raw map markers for FR");
      return;
    }

    await clickFirstMapTarget(page);

    await expect(page.getByTestId("raw-triage-panel")).toBeVisible({ timeout: 20000 });
  });

  test("status filter pills toggle without breaking the map", async ({ page }) => {
    await page.goto("/attractions/raw?country=FR");
    await waitForLeafletMap(page);

    const pendingPill = desktopFilterBar(page).getByTestId("map-filter-pending");
    await expect(pendingPill).toBeVisible();
    await pendingPill.click();

    await expect(page.locator(LEAFLET_CONTAINER)).toBeVisible();
    await expect(page.getByTestId("map-canvas")).toBeVisible();
  });
});

test.describe("Itinerary viewer map", () => {
  test.setTimeout(120000);

  test("loads map from trip view with geo tracking and day navigation", async ({ page }) => {
    await page.goto("/trips");
    await page.waitForLoadState("domcontentloaded");

    const viewLink = page.locator('a[href*="/view"]').first();
    const hasTrips = await viewLink.isVisible({ timeout: 15000 }).catch(() => false);
    if (!hasTrips) {
      test.skip(true, "No trips available in the database");
      return;
    }

    await viewLink.click();
    await waitForLeafletMap(page);

    await expect(page.getByTestId("map-canvas")).toBeVisible();
    await expect(page.getByTestId("map-geo-track")).toBeVisible();

    const nextDay = page.getByTestId("itinerary-next-day");
    if (await nextDay.isEnabled()) {
      await nextDay.click();
      await expect(page.locator(LEAFLET_CONTAINER)).toBeVisible();
    }
  });

  test("marker click opens detail panel on itinerary viewer", async ({ page }) => {
    await page.goto("/trips");
    await page.waitForLoadState("domcontentloaded");

    const viewLink = page.locator('a[href*="/view"]').first();
    const hasTrips = await viewLink.isVisible({ timeout: 15000 }).catch(() => false);
    if (!hasTrips) {
      test.skip(true, "No trips available in the database");
      return;
    }

    await viewLink.click();
    await waitForLeafletMap(page);

    if (!(await hasMapTargets(page))) {
      test.skip(true, "No itinerary map markers available");
      return;
    }

    await clickFirstMapTarget(page);

    await expect(page.getByTestId("map-detail-panel")).toBeVisible({ timeout: 20000 });
  });
});
