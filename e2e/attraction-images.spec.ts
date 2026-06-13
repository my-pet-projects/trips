import { expect, test } from "@playwright/test";

test.describe("Attraction Details API", () => {
  const baseInput = {
    id: 1,
    name: "Eiffel Tower",
    nameLocal: "Tour Eiffel",
    cityId: 2988507,
    countryCode: "FR",
    city: { id: 2988507, name: "Paris" },
  };

  test("fetchAttractionDetails returns image URLs for a known attraction", async ({
    request,
  }) => {
    const input = encodeURIComponent(
      JSON.stringify({ "0": { json: baseInput } }),
    );
    const response = await request.get(
      `/api/trpc/attractionScraper.fetchAttractionDetails?batch=1&input=${input}`,
    );

    expect(response.ok()).toBeTruthy();

    const body = (await response.json()) as {
      result?: { data?: { json?: unknown } };
    }[];
    const data = body[0]?.result?.data?.json as {
      imageUrls?: string[];
      articles?: unknown[];
    };

    expect(Array.isArray(data?.imageUrls)).toBeTruthy();
    expect((data?.imageUrls ?? []).length).toBeGreaterThan(0);

    for (const url of data?.imageUrls ?? []) {
      expect(url).toMatch(/^https?:\/\/.+/);
    }
  });

  test("fetchAttractionDetails returns image URLs without city", async ({
    request,
  }) => {
    const input = encodeURIComponent(
      JSON.stringify({
        "0": { json: { id: 2, name: "Colosseum", countryCode: "IT" } },
      }),
    );
    const response = await request.get(
      `/api/trpc/attractionScraper.fetchAttractionDetails?batch=1&input=${input}`,
    );

    expect(response.ok()).toBeTruthy();

    const body = (await response.json()) as {
      result?: { data?: { json?: unknown } };
    }[];
    const data = body[0]?.result?.data?.json as {
      imageUrls?: string[];
      articles?: unknown[];
    };

    expect(Array.isArray(data?.imageUrls)).toBeTruthy();
    expect((data?.imageUrls ?? []).length).toBeGreaterThan(0);

    for (const url of data?.imageUrls ?? []) {
      expect(url).toMatch(/^https?:\/\/.+/);
    }
  });

  test("fetchAttractionDetails returns related articles", async ({
    request,
  }) => {
    const input = encodeURIComponent(
      JSON.stringify({ "0": { json: baseInput } }),
    );
    const response = await request.get(
      `/api/trpc/attractionScraper.fetchAttractionDetails?batch=1&input=${input}`,
    );

    expect(response.ok()).toBeTruthy();

    const body = (await response.json()) as {
      result?: { data?: { json?: unknown } };
    }[];
    const data = body[0]?.result?.data?.json as {
      imageUrls?: string[];
      articles?: {
        title: string;
        snippet: string;
        url: string;
        lang: string;
      }[];
    };

    expect(Array.isArray(data?.articles)).toBeTruthy();
    expect((data?.articles ?? []).length).toBeGreaterThan(0);

    for (const article of data?.articles ?? []) {
      expect(typeof article.title).toBe("string");
      expect(article.url).toMatch(/^https?:\/\/.+wikipedia\.org\/.+/);
      expect(["en", "ru"]).toContain(article.lang);
    }
  });
});
