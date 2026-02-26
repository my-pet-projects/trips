import { type Page, type Route } from "@playwright/test";
import {
  createMockAttractions,
  createPaginatedResponse,
  mockCitiesBrazil,
  mockCitiesFrance,
  mockCitiesUS,
  mockCountries,
} from "./mock-data";

/**
 * Parse tRPC batch request to extract procedure calls
 */
function parseTrpcBatchRequest(
  url: string,
  postData: string | null,
): Array<{ procedure: string; input: unknown }> {
  const urlObj = new URL(url);
  const batch = urlObj.searchParams.get("batch");
  const input = urlObj.searchParams.get("input");

  // Handle GET requests with batch parameter
  if (batch === "1" && input) {
    const procedures = urlObj.pathname.split("/api/trpc/")[1]?.split(",") ?? [];
    const inputs = JSON.parse(input);

    return procedures.map((proc, i) => ({
      procedure: proc,
      input: inputs[i] ?? null,
    }));
  }

  // Single GET request
  const procedure = urlObj.pathname.split("/api/trpc/")[1];
  if (procedure && input) {
    return [{ procedure, input: JSON.parse(input)["0"] }];
  }

  // Handle POST requests
  if (postData) {
    const procedure = urlObj.pathname.split("/api/trpc/")[1];
    const parsedData = JSON.parse(postData);
    return [{ procedure: procedure ?? "", input: parsedData }];
  }

  return [];
}

/**
 * Create a tRPC batch response
 */
function createTrpcBatchResponse(results: unknown[]) {
  return results.map((data) => ({
    result: { data },
  }));
}

/**
 * Get cities by country code
 */
function getCitiesByCountryCode(countryCode: string) {
  switch (countryCode) {
    case "BR":
      return mockCitiesBrazil;
    case "US":
      return mockCitiesUS;
    case "FR":
      return mockCitiesFrance;
    default:
      return [];
  }
}

type MockOptions = {
  totalAttractions?: number;
};

/**
 * Setup API mocking for attractions page tests
 */
export async function setupAttractionsMocks(
  page: Page,
  options: MockOptions = {},
) {
  const { totalAttractions = 50 } = options;

  await page.route("**/api/trpc/**", async (route: Route) => {
    const url = route.request().url();
    const postData = route.request().postData();

    try {
      const calls = parseTrpcBatchRequest(url, postData);

      if (calls.length === 0) {
        return route.continue();
      }

      const results = calls.map(({ procedure, input }) => {
        // geo.getCountries
        if (procedure === "geo.getCountries") {
          return mockCountries;
        }

        // geo.getCitiesByCountry
        if (procedure === "geo.getCitiesByCountry") {
          const countryCode =
            (input as { countryCode?: string })?.countryCode ?? "";
          return getCitiesByCountryCode(countryCode);
        }

        // attraction.paginateAttractions
        if (procedure === "attraction.paginateAttractions") {
          const {
            limit = 20,
            offset = 0,
            country,
            city,
          } = (input as {
            limit?: number;
            offset?: number;
            country?: string;
            city?: string;
          }) ?? {};

          const countryCode = country ?? "BR";
          const cityName =
            city ?? (countryCode === "BR" ? "Rio de Janeiro" : "City");

          const allAttractions = createMockAttractions(totalAttractions, {
            countryCode,
            cityName,
          });
          const paginatedAttractions = allAttractions.slice(
            offset,
            offset + limit,
          );

          return createPaginatedResponse(
            paginatedAttractions,
            totalAttractions,
            limit,
            offset,
          );
        }

        // attraction.getAttractionById
        if (procedure === "attraction.getAttractionById") {
          const { id } = (input as { id: number }) ?? { id: 1 };
          const attractions = createMockAttractions(1, {});
          return { ...attractions[0], id };
        }

        // Fallback - continue with actual request
        return null;
      });

      // If any result is null, continue with actual request
      if (results.some((r) => r === null)) {
        return route.continue();
      }

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(createTrpcBatchResponse(results)),
      });
    } catch (error) {
      console.error("Mock error:", error);
      return route.continue();
    }
  });
}
