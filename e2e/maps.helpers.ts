import { expect, type Page } from "@playwright/test";

export const LEAFLET_CONTAINER = ".leaflet-container";
export const LEAFLET_CIRCLE_MARKER =
  ".leaflet-marker-pane .leaflet-marker-icon:not(.marker-cluster)";
export const MARKER_CLUSTER = ".marker-cluster";

export async function waitForLeafletMap(page: Page) {
  await expect(page.locator(LEAFLET_CONTAINER)).toBeVisible({ timeout: 45000 });
}

export function desktopFilterBar(page: Page) {
  return page.getByTestId("map-filter-bar-desktop");
}

export async function clickFirstMapTarget(page: Page) {
  const zoomIn = page.locator(".leaflet-control-zoom-in");

  for (let i = 0; i < 15; i++) {
    const marker = page.locator(LEAFLET_CIRCLE_MARKER).first();
    if (await marker.isVisible().catch(() => false)) {
      await marker.dispatchEvent("click");
      return;
    }

    if (await zoomIn.isEnabled().catch(() => false)) {
      await zoomIn.click();
      await page.waitForTimeout(250);
    }
  }

  const cluster = page.locator(MARKER_CLUSTER).first();
  if (await cluster.isVisible().catch(() => false)) {
    await cluster.dispatchEvent("click");
    await page.waitForTimeout(750);
  }

  const marker = page.locator(LEAFLET_CIRCLE_MARKER).first();
  await expect(marker).toBeVisible({ timeout: 15000 });
  await marker.dispatchEvent("click");
}

export async function waitForMapTargets(page: Page) {
  await expect(async () => {
    const markerCount = await page.locator(LEAFLET_CIRCLE_MARKER).count();
    const clusterCount = await page.locator(MARKER_CLUSTER).count();
    expect(markerCount + clusterCount).toBeGreaterThan(0);
  }).toPass({ timeout: 45000 });
}

export async function hasMapTargets(page: Page): Promise<boolean> {
  try {
    await waitForMapTargets(page);
    return true;
  } catch {
    return false;
  }
}
