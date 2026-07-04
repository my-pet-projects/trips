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

export type TripsExtensionMessage = {
  type: "TRIPS_IMAGE_SEARCH";
  detail: TripsImageSearchDetail;
};

export type TripsPageMessage = {
  source: "trips-image-extension";
  type: "trips-image-search";
  detail: TripsImageSearchDetail;
};

export type DdgImageResult = {
  thumbnail?: string;
  image?: string;
  url?: string;
  title?: string;
  source?: string;
};
