/** Bare coordinates are points with no attraction row behind them, i.e. overnight stops. */
export type RoutePoint =
  | { kind: "attraction"; id: number; lat: number; lng: number }
  | { kind: "coordinate"; lat: number; lng: number };

export function attractionsToRoutePoints(
  attractions: ReadonlyArray<{
    id: number;
    latitude: number | null;
    longitude: number | null;
  }>,
): RoutePoint[] {
  return attractions
    .filter((a) => a.latitude != null && a.longitude != null)
    .map((a) => ({
      kind: "attraction" as const,
      id: a.id,
      lat: a.latitude!,
      lng: a.longitude!,
    }));
}
