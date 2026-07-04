export const TRIPS_IMAGE_SEARCH_EVENT = "trips-image-search";

export type TripsImageSource =
  | "map-raw"
  | "map-browse"
  | "map-itinerary"
  | "map-view"
  | "form-verify";

export type TripsImageSearchDetail = {
  query: string;
  name: string;
  nameLocal?: string | null;
  city?: string | null;
  lat: number;
  lng: number;
  source: TripsImageSource;
};

export type TripsImageExtensionInput = {
  name: string;
  nameLocal?: string | null;
  city?: string | { name: string } | null;
  latitude: number | null;
  longitude: number | null;
};

function resolveCityName(
  city: TripsImageExtensionInput["city"],
): string | null {
  if (city == null) return null;
  if (typeof city === "string") return city;
  return city.name ?? null;
}

export function notifyTripsImageExtension(
  source: TripsImageSource,
  attraction: TripsImageExtensionInput,
) {
  if (attraction.latitude == null || attraction.longitude == null) return;

  const detail: TripsImageSearchDetail = {
    query: attraction.nameLocal?.trim() || attraction.name,
    name: attraction.name,
    nameLocal: attraction.nameLocal ?? null,
    city: resolveCityName(attraction.city),
    lat: attraction.latitude,
    lng: attraction.longitude,
    source,
  };

  window.dispatchEvent(
    new CustomEvent<TripsImageSearchDetail>(TRIPS_IMAGE_SEARCH_EVENT, { detail }),
  );
}
