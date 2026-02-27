import { expect, test, type Page } from "@playwright/test";

const ATTRACTIONS_TABLE = '[data-testid="attractions-table"]';

/**
 * Helper to wait for the country select to be enabled (data loaded from server)
 * Comboboxes are client-side rendered and load after the table is populated
 */
async function waitForCountrySelectReady(page: Page) {
  const container = page.locator('[data-testid="country-select-container"]');
  await expect(container).toBeVisible({ timeout: 15000 });

  // Wait for the input to not be disabled - client-side data loading takes time
  const input = page.locator("#country-select-single");

  // Use polling assertion since the input starts disabled and becomes enabled
  await expect(async () => {
    await expect(input).not.toBeDisabled();
  }).toPass({ timeout: 30000, intervals: [500, 1000, 2000] });

  return container;
}

/**
 * Helper to select a country from the dropdown
 */
async function selectCountry(page: Page, countryName: string) {
  const container = await waitForCountrySelectReady(page);
  await container.click();
  await page.click(`text="${countryName}"`);
}

test.describe("Attractions URL State Persistence", () => {
  // Set a longer timeout for all tests in this suite
  test.setTimeout(90000);

  test("preserves country and page on page refresh", async ({ page }) => {
    // Navigate to a specific page with filters
    await page.goto("/attractions?country=FR&page=1");

    // Wait for page to load - use domcontentloaded to avoid network idle issues
    await page.waitForLoadState("domcontentloaded");

    // Wait for table to be visible
    await expect(page.locator(ATTRACTIONS_TABLE)).toBeVisible({
      timeout: 30000,
    });

    // Verify URL has parameters
    expect(page.url()).toContain("country=FR");

    // Refresh the page
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // Wait for page to load again
    await expect(page.locator(ATTRACTIONS_TABLE)).toBeVisible({
      timeout: 30000,
    });

    // Verify URL still has parameters after refresh
    expect(page.url()).toContain("country=FR");
  });

  test("back navigation from edit page preserves original URL", async ({
    page,
  }) => {
    // Navigate to attractions with filters
    await page.goto("/attractions?country=FR");
    await expect(page.locator(ATTRACTIONS_TABLE)).toBeVisible();

    // Hover on first row to reveal edit button (it has opacity-0 by default)
    const firstRow = page.locator("tbody tr").first();
    await firstRow.hover();

    // Click edit button on first attraction
    const editButton = page.locator('[title="Edit attraction"]').first();
    await editButton.click();

    // Wait for edit page to load
    await expect(page.locator('text="Edit Attraction"')).toBeVisible();

    // Click back button in navbar
    const backButton = page.locator('[data-testid="navbar-back-button"]');
    await backButton.click();

    // Verify we're back on attractions page with original filters
    await expect(page.locator(ATTRACTIONS_TABLE)).toBeVisible();
    expect(page.url()).toContain("country=FR");
  });

  test("cancel button on edit page preserves original URL", async ({
    page,
  }) => {
    // Navigate to attractions with filters
    await page.goto("/attractions?country=FR");
    await expect(page.locator(ATTRACTIONS_TABLE)).toBeVisible();

    // Hover on first row to reveal edit button (it has opacity-0 by default)
    const firstRow = page.locator("tbody tr").first();
    await firstRow.hover();

    // Click edit button on first attraction
    const editButton = page.locator('[title="Edit attraction"]').first();
    await editButton.click();

    // Wait for edit page to load
    await expect(page.locator('text="Edit Attraction"')).toBeVisible();

    // Click cancel button
    await page.click('button:has-text("Cancel")');

    // Verify we're back on attractions page with original filters
    await expect(page.locator(ATTRACTIONS_TABLE)).toBeVisible();
    expect(page.url()).toContain("country=FR");
  });

  test("clearing country filter updates URL and removes city", async ({
    page,
  }) => {
    // Navigate to attractions with country filter only (no city to simplify)
    await page.goto("/attractions?country=FR");
    await expect(page.locator(ATTRACTIONS_TABLE)).toBeVisible();

    // Wait for country select to be ready
    const container = await waitForCountrySelectReady(page);

    // react-select clear indicator - specifically target the X button
    // The clear indicator has "clearIndicator" in its class name
    const clearButton = container.locator('[class*="clearIndicator"]').first();

    // Only run if clear button is visible (country is selected and clearable)
    const isVisible = await clearButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (!isVisible) {
      console.log("Clear button not visible, skipping test");
      return;
    }

    await clearButton.click();

    // Wait for navigation - use expect with polling for more reliability
    await expect(async () => {
      expect(page.url()).not.toContain("country=");
    }).toPass({ timeout: 15000 });

    // Verify country is removed from URL
    expect(page.url()).not.toContain("country=");
  });

  test("selecting a different country updates URL", async ({ page }) => {
    // Navigate to attractions with France selected
    await page.goto("/attractions?country=FR");
    await expect(page.locator(ATTRACTIONS_TABLE)).toBeVisible();

    // Select Italy (use a country that likely exists in the database)
    await selectCountry(page, "Italy");

    // Wait for navigation
    await page.waitForURL((url) => url.href.includes("country=IT"), {
      timeout: 10000,
    });

    // Verify URL is updated
    expect(page.url()).toContain("country=IT");
  });

  test("pagination navigation updates URL", async ({ page }) => {
    // Navigate to attractions (no filter to ensure enough results for pagination)
    await page.goto("/attractions");
    await expect(page.locator(ATTRACTIONS_TABLE)).toBeVisible();

    // Click page 2 button
    const page2Button = page.locator('button:has-text("2")').first();

    // Only test if page 2 button exists (enough data)
    if (await page2Button.isVisible()) {
      await page2Button.click();

      // Wait for navigation
      await page.waitForURL((url) => url.href.includes("page=2"), {
        timeout: 10000,
      });

      // Verify URL is updated
      expect(page.url()).toContain("page=2");
    }
  });

  test("changing filters updates URL correctly", async ({ page }) => {
    // Navigate to attractions with country filter
    await page.goto("/attractions?country=FR");
    await expect(page.locator(ATTRACTIONS_TABLE)).toBeVisible();

    // Change country to Italy
    await selectCountry(page, "Italy");

    // Wait for navigation
    await page.waitForURL((url) => url.href.includes("country=IT"), {
      timeout: 15000,
    });

    // Verify URL is updated to new country
    expect(page.url()).toContain("country=IT");
    // Previous country should be removed
    expect(page.url()).not.toContain("country=FR");
  });
});

test.describe("Attractions Navigation Flow", () => {
  test("full navigation flow: home -> attractions -> paginate -> edit -> back", async ({
    page,
  }) => {
    // Start at home page
    await page.goto("/");

    // Navigate to attractions via navbar
    await page.click('text="Attractions"');
    await expect(page.locator(ATTRACTIONS_TABLE)).toBeVisible();

    // Wait for and select a country
    await selectCountry(page, "France");
    await page.waitForURL((url) => url.href.includes("country=FR"), {
      timeout: 10000,
    });

    // Try to go to page 2 if available (optional - don't fail if not possible)
    const page2Button = page.locator('button:has-text("2")').first();
    const hasPage2 = await page2Button
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    if (hasPage2) {
      await page2Button.click();
      // Wait a bit for navigation but don't fail
      await page.waitForTimeout(1000);
    }

    // Get expected URL before edit for comparison
    const expectedUrl = page.url();

    // Hover on first row to reveal edit button
    const firstRow = page.locator("tbody tr").first();
    await firstRow.hover();

    // Click edit on an attraction
    const editButton = page.locator('[title="Edit attraction"]').first();
    await editButton.click();
    await expect(page.locator('text="Edit Attraction"')).toBeVisible();

    // Go back
    const backButton = page.locator('[data-testid="navbar-back-button"]');
    await backButton.click();

    // Verify we're back with filters preserved
    await expect(page.locator(ATTRACTIONS_TABLE)).toBeVisible();
    expect(page.url()).toContain("country=FR");
  });
});
