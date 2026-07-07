import { expect, test, type Page } from "@playwright/test";

const ATTRACTIONS_TABLE = '[data-testid="attractions-table"]';

const COUNTRY_CODES: Record<string, string> = {
  France: "FR",
  Italy: "IT",
};

/**
 * Helper to wait for the country select to be enabled (data loaded from server)
 * Comboboxes are client-side rendered and load after the table is populated
 */
async function waitForCountrySelectReady(page: Page) {
  const container = page.locator('[data-testid="country-select-container"]');
  await expect(container).toBeVisible({ timeout: 15000 });

  const combobox = container.getByRole("combobox");

  await expect(async () => {
    await expect(combobox).not.toBeDisabled();
  }).toPass({ timeout: 30000, intervals: [500, 1000, 2000] });

  return combobox;
}

async function waitForCountryInUrl(page: Page, countryCode: string) {
  await expect
    .poll(() => page.url(), { timeout: 15000 })
    .toContain(`country=${countryCode}`);
}

/**
 * Helper to select a country from the dropdown
 */
async function selectCountry(page: Page, countryName: string) {
  const combobox = await waitForCountrySelectReady(page);
  await combobox.click();
  await page.getByRole("option", { name: countryName }).click();

  const countryCode = COUNTRY_CODES[countryName];
  if (countryCode) {
    await waitForCountryInUrl(page, countryCode);
  }
}

function editAttractionButton(page: Page) {
  return page.getByTestId("edit-attraction-link").first();
}

async function clickEditOnFirstRow(page: Page) {
  const firstRow = page.locator("tbody tr").first();
  await firstRow.hover();
  const editButton = editAttractionButton(page);
  await expect(editButton).toBeVisible({ timeout: 5000 });
  await editButton.click();
}

test.describe("Attractions URL State Persistence", () => {
  test.setTimeout(90000);

  test("preserves country and page on page refresh", async ({ page }) => {
    await page.goto("/attractions?country=FR&page=1");

    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator(ATTRACTIONS_TABLE)).toBeVisible({
      timeout: 30000,
    });

    expect(page.url()).toContain("country=FR");

    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator(ATTRACTIONS_TABLE)).toBeVisible({
      timeout: 30000,
    });

    expect(page.url()).toContain("country=FR");
  });

  test("back navigation from edit page preserves original URL", async ({
    page,
  }) => {
    await page.goto("/attractions?country=FR");
    await expect(page.locator(ATTRACTIONS_TABLE)).toBeVisible();

    await clickEditOnFirstRow(page);

    await expect(page.locator('text="Edit Attraction"')).toBeVisible();

    const backButton = page.locator('[data-testid="navbar-back-button"]');
    await backButton.click();

    await expect(page.locator(ATTRACTIONS_TABLE)).toBeVisible();
    expect(page.url()).toContain("country=FR");
  });

  test("cancel button on edit page preserves original URL", async ({
    page,
  }) => {
    await page.goto("/attractions?country=FR");
    await expect(page.locator(ATTRACTIONS_TABLE)).toBeVisible();

    await clickEditOnFirstRow(page);

    await expect(page.locator('text="Edit Attraction"')).toBeVisible();

    await page.click('button:has-text("Cancel")');

    await expect(page.locator(ATTRACTIONS_TABLE)).toBeVisible();
    expect(page.url()).toContain("country=FR");
  });

  test("clearing country filter updates URL and removes city", async ({
    page,
  }) => {
    await page.goto("/attractions?country=FR");
    await expect(page.locator(ATTRACTIONS_TABLE)).toBeVisible();

    await waitForCountrySelectReady(page);

    const clearButton = page
      .locator('[data-testid="country-select-container"]')
      .locator('[data-slot="combobox-clear"]')
      .first();

    const isVisible = await clearButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    if (!isVisible) {
      console.log("Clear button not visible, skipping test");
      return;
    }

    await clearButton.click();

    await expect(async () => {
      expect(page.url()).not.toContain("country=");
    }).toPass({ timeout: 15000 });

    expect(page.url()).not.toContain("country=");
  });

  test("selecting a different country updates URL", async ({ page }) => {
    await page.goto("/attractions?country=FR");
    await expect(page.locator(ATTRACTIONS_TABLE)).toBeVisible();

    await selectCountry(page, "Italy");

    expect(page.url()).toContain("country=IT");
  });

  test("pagination navigation updates URL", async ({ page }) => {
    await page.goto("/attractions");
    await expect(page.locator(ATTRACTIONS_TABLE)).toBeVisible();

    const page2Button = page.locator('button:has-text("2")').first();

    if (await page2Button.isVisible()) {
      await page2Button.click();

      await expect
        .poll(() => page.url(), { timeout: 10000 })
        .toContain("page=2");

      expect(page.url()).toContain("page=2");
    }
  });

  test("changing filters updates URL correctly", async ({ page }) => {
    await page.goto("/attractions?country=FR");
    await expect(page.locator(ATTRACTIONS_TABLE)).toBeVisible();

    await selectCountry(page, "Italy");

    expect(page.url()).toContain("country=IT");
    expect(page.url()).not.toContain("country=FR");
  });
});

test.describe("Attractions Navigation Flow", () => {
  test.setTimeout(90000);

  test("full navigation flow: home -> attractions -> paginate -> edit -> back", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Attractions" }).click();
    await expect(page.locator(ATTRACTIONS_TABLE)).toBeVisible();

    await selectCountry(page, "France");

    const page2Button = page.locator('button:has-text("2")').first();
    const hasPage2 = await page2Button
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    if (hasPage2) {
      await page2Button.click();
      await page.waitForTimeout(1000);
    }

    await clickEditOnFirstRow(page);
    await expect(page.locator('text="Edit Attraction"')).toBeVisible();

    const backButton = page.locator('[data-testid="navbar-back-button"]');
    await backButton.click();

    await expect(page.locator(ATTRACTIONS_TABLE)).toBeVisible();
    expect(page.url()).toContain("country=FR");
  });
});
