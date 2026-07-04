export const ATTRACTION_SELECTED_EVENT = "trips-attraction-selected";

export type MapExtensionContext = "raw" | "browse" | "itinerary" | "view";

export type AttractionSelectedDetail = {
  query: string;
  name: string;
  nameLocal?: string | null;
  city?: string | null;
  lat: number;
  lng: number;
  map: MapExtensionContext;
};

export function notifyMapExtensionSelection(
  map: MapExtensionContext,
  attraction: {
    name: string;
    nameLocal?: string | null;
    city?: string | null;
    latitude: number | null;
    longitude: number | null;
  },
) {
  if (attraction.latitude == null || attraction.longitude == null) return;

  const detail: AttractionSelectedDetail = {
    query: attraction.nameLocal?.trim() || attraction.name,
    name: attraction.name,
    nameLocal: attraction.nameLocal ?? null,
    city: attraction.city ?? null,
    lat: attraction.latitude,
    lng: attraction.longitude,
    map,
  };

  window.dispatchEvent(
    new CustomEvent<AttractionSelectedDetail>(ATTRACTION_SELECTED_EVENT, { detail }),
  );
}
