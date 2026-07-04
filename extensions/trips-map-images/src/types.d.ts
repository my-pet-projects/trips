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

export type TripsExtensionMessage = {
  type: "TRIPS_ATTRACTION_SELECTED";
  detail: AttractionSelectedDetail;
};

export type TripsPageMessage = {
  source: "trips-map-images";
  type: "trips-attraction-selected";
  detail: AttractionSelectedDetail;
};

export type DdgImageResult = {
  thumbnail?: string;
  image?: string;
  url?: string;
  title?: string;
  source?: string;
};
