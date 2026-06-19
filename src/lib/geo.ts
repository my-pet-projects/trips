const EARTH_RADIUS_KM = 6371;

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findClosestCity<T extends { latitude: number; longitude: number }>(
  lat: number,
  lon: number,
  cities: T[],
): { city: T; distanceKm: number } | null {
  if (!cities.length) return null;
  let closest = cities[0]!;
  let minDist = haversineDistance(lat, lon, closest.latitude, closest.longitude);
  for (let i = 1; i < cities.length; i++) {
    const dist = haversineDistance(lat, lon, cities[i]!.latitude, cities[i]!.longitude);
    if (dist < minDist) {
      minDist = dist;
      closest = cities[i]!;
    }
  }
  return { city: closest, distanceKm: minDist };
}
