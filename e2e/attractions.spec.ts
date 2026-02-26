import { expect, test, type Page } from "@playwright/test";

/**
 * Helper to wait for the country select to be enabled (data loaded from server)
 */
async function waitForCountrySelectReady(page: Page) {
  const container = page.locator('[data-testid="country-select-container"]');
  await expect(container).toBeVisible({ timeout: 10000 });

  // Wait for the input to not be disabled
  const input = page.locator("#country-select-single");
  await expect(input).not.toBeDisabled({ timeout: 10000 });

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
  test("preserves country, city, and page on page refresh", async ({
    page,
  }) => {
    // Navigate to a specific page with filters (use FR/Paris as they likely exist)
    await page.goto("/attractions?country=FR&city=Paris&page=2");

    // Wait for page to load
    await expect(page.locator("table")).toBeVisible();

    // Verify URL has all parameters
    expect(page.url()).toContain("country=FR");
    expect(page.url()).toContain("city=Paris");
    expect(page.url()).toContain("page=2");

    // Refresh the page
    await page.reload();

    // Wait for page to load again
    await expect(page.locator("table")).toBeVisible();

    // Verify URL still has all parameters after refresh
    expect(page.url()).toContain("country=FR");
    expect(page.url()).toContain("city=Paris");
    expect(page.url()).toContain("page=2");
  });

  test("back navigation from edit page preserves original URL", async ({
    page,
  }) => {
    // Navigate to attractions with filters and pagination
    await page.goto("/attractions?country=FR&page=2");
    await expect(page.locator("table")).toBeVisible();

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
    await expect(page.locator("table")).toBeVisible();
    expect(page.url()).toContain("country=FR");
    expect(page.url()).toContain("page=2");
  });

  test("cancel button on edit page preserves original URL", async ({
    page,
  }) => {
    // Navigate to attractions with filters and pagination
    await page.goto("/attractions?country=FR&page=2");
    await expect(page.locator("table")).toBeVisible();

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
    await expect(page.locator("table")).toBeVisible();
    expect(page.url()).toContain("country=FR");
    expect(page.url()).toContain("page=2");
  });

  test("clearing country filter updates URL and removes city", async ({
    page,
  }) => {
    // Navigate to attractions with country filter
    await page.goto("/attractions?country=FR&city=Paris");
    await expect(page.locator("table")).toBeVisible();

    // Wait for country select to be ready
    const container = await waitForCountrySelectReady(page);

    // react-select clear indicator - inside the indicators container
    const indicatorsContainer = container
      .locator('[class*="indicatorContainer"]')
      .first();
    await indicatorsContainer.click();

    // Wait for navigation - use expect with polling for more reliability
    await expect(async () => {
      expect(page.url()).not.toContain("country=");
    }).toPass({ timeout: 10000 });

    // Verify country and city are removed from URL
    expect(page.url()).not.toContain("country=");
    expect(page.url()).not.toContain("city=");
  });

  test("selecting a different country updates URL", async ({ page }) => {
    // Navigate to attractions with France selected
    await page.goto("/attractions?country=FR");
    await expect(page.locator("table")).toBeVisible();

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
    await expect(page.locator("table")).toBeVisible();

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

  test("changing filters resets pagination to page 1", async ({ page }) => {
    // Navigate to attractions on page 2
    await page.goto("/attractions?country=FR&page=2");
    await expect(page.locator("table")).toBeVisible();

    // Change country to Italy
    await selectCountry(page, "Italy");

    // Wait for navigation
    await page.waitForURL((url) => url.href.includes("country=IT"), {
      timeout: 10000,
    });

    // Verify page parameter is removed (reset to page 1)
    expect(page.url()).toContain("country=IT");
    expect(page.url()).not.toContain("page=2");
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
    await expect(page.locator("table")).toBeVisible();

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
    await expect(page.locator("table")).toBeVisible();
    expect(page.url()).toContain("country=FR");
  });
});
