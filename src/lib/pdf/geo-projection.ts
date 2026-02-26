/**
 * Web Mercator projection utilities for converting geographic coordinates
 * to tile and pixel coordinates used by map tile systems like OpenStreetMap.
 */

export const TILE_SIZE = 256;

/** Bounds for a geographic area */
export type GeoBounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

/** Tile coordinates with pixel offset within the tile */
export type TileCoordinates = {
  tileX: number;
  tileY: number;
  pixelInTileX: number;
  pixelInTileY: number;
};

/** 2D pixel coordinates */
export type PixelCoordinates = {
  x: number;
  y: number;
};

/** Convert latitude to Mercator Y component (0-1 range for world coordinates) */
export function latToMercatorY(lat: number): number {
  const latRad = (lat * Math.PI) / 180;
  return (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2;
}

/** Convert lat/lng to world pixel coordinates at a given zoom level */
export function latLngToWorldPixel(
  lat: number,
  lng: number,
  zoom: number,
): PixelCoordinates {
  const scale = Math.pow(2, zoom) * TILE_SIZE;
  return {
    x: ((lng + 180) / 360) * scale,
    y: latToMercatorY(lat) * scale,
  };
}

/** Convert lat/lng to tile coordinates at a given zoom level */
export function latLngToTile(
  lat: number,
  lng: number,
  zoom: number,
): TileCoordinates {
  const n = Math.pow(2, zoom);
  const xFloat = ((lng + 180) / 360) * n;
  const yFloat = latToMercatorY(lat) * n;
  const tileX = Math.floor(xFloat);
  const tileY = Math.floor(yFloat);
  return {
    tileX,
    tileY,
    pixelInTileX: (xFloat - tileX) * TILE_SIZE,
    pixelInTileY: (yFloat - tileY) * TILE_SIZE,
  };
}

/** Calculate zoom level that fits all points within given canvas dimensions */
export function calculateZoomToFit(
  bounds: GeoBounds,
  canvasWidth: number,
  canvasHeight: number,
  padding = 1.15,
): number {
  for (let zoom = 16; zoom >= 2; zoom--) {
    const topLeft = latLngToWorldPixel(bounds.maxLat, bounds.minLng, zoom);
    const bottomRight = latLngToWorldPixel(bounds.minLat, bounds.maxLng, zoom);
    const boundsWidth = Math.abs(bottomRight.x - topLeft.x);
    const boundsHeight = Math.abs(bottomRight.y - topLeft.y);

    if (
      boundsWidth * padding < canvasWidth &&
      boundsHeight * padding < canvasHeight
    ) {
      return zoom;
    }
  }
  return 2;
}

/** Calculate bounds from an array of coordinates */
export function calculateBounds(
  coords: { lat: number; lng: number }[],
): GeoBounds {
  const lats = coords.map((c) => c.lat);
  const lngs = coords.map((c) => c.lng);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

/** Calculate center point of bounds */
export function calculateCenter(bounds: GeoBounds): {
  lat: number;
  lng: number;
} {
  return {
    lat: (bounds.minLat + bounds.maxLat) / 2,
    lng: (bounds.minLng + bounds.maxLng) / 2,
  };
}
