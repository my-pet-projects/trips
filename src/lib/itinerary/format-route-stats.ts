export function formatRouteDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function formatRouteKm(distanceMeters: number): string {
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

export function formatRouteLegStats(
  distanceMeters: number,
  durationSeconds: number,
): string {
  return `${formatRouteKm(distanceMeters)} · ${formatRouteDuration(durationSeconds)}`;
}
