import { expect, test } from "@playwright/test";

import {
  clickFirstMapTarget,
  desktopFilterBar,
  hasMapTargets,
  LEAFLET_CONTAINER,
  waitForLeafletMap,
} from "./maps.helpers";

test.describe("Browse attractions map", () => {
  test.setTimeout(120000);

  test("loads map with filter bar and toggles verified filter", async ({ page }) => {
    await page.goto("/attractions/map");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByTestId("browse-map-view")).toBeVisible();
    await waitForLeafletMap(page);

    const verifiedPill = desktopFilterBar(page).getByTestId("map-filter-verified");
    await expect(verifiedPill).toBeVisible();
    await verifiedPill.click();

    await expect(desktopFilterBar(page).getByTestId("map-filter-must_see")).toBeDisabled();
  });

  test("clicking a marker opens the detail panel", async ({ page }) => {
    await page.goto("/attractions/map");
    await waitForLeafletMap(page);

    if (!(await hasMapTargets(page))) {
      test.skip(true, "No map markers available");
      return;
    }

    await clickFirstMapTarget(page);

    await expect(page.getByTestId("map-detail-panel")).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId("map-detail-panel")).toContainText(/.+/);
  });
});
