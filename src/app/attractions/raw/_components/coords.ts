export type MapCoords = {
  latitude: number;
  longitude: number;
  missingCoords: boolean;
};

export function normalizeMapCoords<
  T extends { latitude: number | null; longitude: number | null },
>(item: T): T & MapCoords {
  const missingCoords = item.latitude == null || item.longitude == null;
  return {
    ...item,
    latitude: item.latitude ?? 0,
    longitude: item.longitude ?? 0,
    missingCoords,
  };
}
