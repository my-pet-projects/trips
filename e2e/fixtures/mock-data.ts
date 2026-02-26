/**
 * Mock data fixtures for E2E tests.
 * These mirror the structure returned by tRPC API endpoints.
 */

export const mockCountries = [
  { cca2: "BR", cca3: "BRA", name: "Brazil" },
  { cca2: "US", cca3: "USA", name: "United States" },
  { cca2: "FR", cca3: "FRA", name: "France" },
];

export const mockCitiesBrazil = [
  {
    id: 1,
    name: "Rio de Janeiro",
    countryCode: "BR",
    latitude: -22.9068,
    longitude: -43.1729,
  },
  {
    id: 2,
    name: "São Paulo",
    countryCode: "BR",
    latitude: -23.5505,
    longitude: -46.6333,
  },
];

export const mockCitiesUS = [
  {
    id: 3,
    name: "New York",
    countryCode: "US",
    latitude: 40.7128,
    longitude: -74.006,
  },
];

export const mockCitiesFrance = [
  {
    id: 4,
    name: "Paris",
    countryCode: "FR",
    latitude: 48.8566,
    longitude: 2.3522,
  },
];

export function createMockAttractions(
  count: number,
  options: { countryCode?: string; cityName?: string } = {},
) {
  const { countryCode = "BR", cityName = "Rio de Janeiro" } = options;

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Attraction ${i + 1}`,
    nameLocal: `Atração ${i + 1}`,
    description: `Description for attraction ${i + 1}`,
    latitude: -22.9068 + i * 0.01,
    longitude: -43.1729 + i * 0.01,
    sourceUrl: null,
    cityId: 1,
    countryCode,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    isVerified: i % 2 === 0,
    city: {
      id: 1,
      name: cityName,
      countryCode,
      latitude: -22.9068,
      longitude: -43.1729,
      country: {
        cca2: countryCode,
        cca3: countryCode === "BR" ? "BRA" : countryCode,
        name: countryCode === "BR" ? "Brazil" : countryCode,
      },
    },
  }));
}

export function createPaginatedResponse(
  attractions: ReturnType<typeof createMockAttractions>,
  total: number,
  limit = 20,
  offset = 0,
) {
  return {
    attractions,
    pagination: {
      limit,
      offset,
      total,
    },
  };
}
