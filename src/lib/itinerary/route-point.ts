/** Bare coordinates are points with no attraction row behind them, i.e. overnight stops. */
export type RoutePoint =
  | { kind: "attraction"; id: number; lat: number; lng: number }
  | { kind: "coordinate"; lat: number; lng: number };

type GeocodedAttractionLike = {
  id: number;
  latitude: number | null;
  longitude: number | null;
};

export function attractionsToRoutePoints(
  attractions: ReadonlyArray<GeocodedAttractionLike>,
): RoutePoint[] {
  return attractions.flatMap((attraction) => {
    const point = attractionToRoutePoint(attraction);
    return point ? [point] : [];
  });
}

export function firstGeocodedRoutePoint(
  attractions: ReadonlyArray<GeocodedAttractionLike>,
): RoutePoint | null {
  for (const attraction of attractions) {
    const point = attractionToRoutePoint(attraction);
    if (point) return point;
  }
  return null;
}

export function lastGeocodedRoutePoint(
  attractions: ReadonlyArray<GeocodedAttractionLike>,
): RoutePoint | null {
  for (let i = attractions.length - 1; i >= 0; i--) {
    const point = attractionToRoutePoint(attractions[i]!);
    if (point) return point;
  }
  return null;
}

function attractionToRoutePoint(
  attraction: GeocodedAttractionLike,
): Extract<RoutePoint, { kind: "attraction" }> | null {
  if (attraction.latitude == null || attraction.longitude == null) {
    return null;
  }
  return {
    kind: "attraction",
    id: attraction.id,
    lat: attraction.latitude,
    lng: attraction.longitude,
  };
}
