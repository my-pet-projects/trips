/**
 * Static map image generation using OpenStreetMap tiles.
 * Creates canvas-based map images with numbered markers.
 */

import {
  TILE_SIZE,
  calculateBounds,
  calculateCenter,
  calculateZoomToFit,
  latLngToTile,
  latLngToWorldPixel,
  type PixelCoordinates,
} from "./geo-projection";

/** Marker data for map rendering */
export type MapMarker = {
  lat: number;
  lng: number;
  orderNumber: number;
};

// Map image cache to avoid re-fetching
const mapImageCache = new Map<string, string>();

// Tile cache for reusing tiles across different maps
const tileCache = new Map<string, ImageBitmap>();

/** Fetches a single tile with caching */
async function fetchTile(
  zoom: number,
  x: number,
  y: number,
): Promise<ImageBitmap | null> {
  const cacheKey = `${zoom}/${x}/${y}`;
  if (tileCache.has(cacheKey)) {
    return tileCache.get(cacheKey)!;
  }

  try {
    const tileUrl = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
    const response = await fetch(tileUrl);
    if (!response.ok) {
      return null;
    }
    const blob = await response.blob();
    const img = await createImageBitmap(blob);
    tileCache.set(cacheKey, img);
    return img;
  } catch {
    return null;
  }
}

/**
 * Fetches OSM tiles and renders them to a canvas, centered on the given coordinates.
 */
async function renderTilesToCanvas(
  centerLat: number,
  centerLng: number,
  zoom: number,
  canvasWidth: number,
  canvasHeight: number,
): Promise<{
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  centerWorldPixel: PixelCoordinates;
}> {
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d")!;

  const { tileX, tileY, pixelInTileX, pixelInTileY } = latLngToTile(
    centerLat,
    centerLng,
    zoom,
  );
  const centerWorldPixel = latLngToWorldPixel(centerLat, centerLng, zoom);

  // Calculate offset to center the point
  const offsetX = canvasWidth / 2 - pixelInTileX;
  const offsetY = canvasHeight / 2 - pixelInTileY;

  // Determine tile grid needed - reduced padding for smaller canvases
  const tilesX = Math.ceil(canvasWidth / TILE_SIZE) + 1;
  const tilesY = Math.ceil(canvasHeight / TILE_SIZE) + 1;
  const tiles: { x: number; y: number; dx: number; dy: number }[] = [];

  for (let dy = -Math.floor(tilesY / 2); dy <= Math.floor(tilesY / 2); dy++) {
    for (let dx = -Math.floor(tilesX / 2); dx <= Math.floor(tilesX / 2); dx++) {
      tiles.push({ x: tileX + dx, y: tileY + dy, dx, dy });
    }
  }

  // Load and draw tiles (using cached tiles)
  await Promise.all(
    tiles.map(async (tile) => {
      const img = await fetchTile(zoom, tile.x, tile.y);
      if (img) {
        ctx.drawImage(
          img,
          offsetX + tile.dx * TILE_SIZE,
          offsetY + tile.dy * TILE_SIZE,
        );
      }
    }),
  );

  return { canvas, ctx, centerWorldPixel };
}

/**
 * Draws a pin-shaped marker on a canvas at the specified pixel position.
 * The pin points downward with the tip at (x, y).
 */
function drawMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  orderNumber: number,
  color: string,
  size = 14,
): void {
  const circleRadius = size;
  const pinHeight = size * 1.5;
  const circleY = y - pinHeight; // Circle center is above the tip

  // Shadow
  ctx.save();
  ctx.translate(2, 2);
  ctx.beginPath();
  ctx.arc(x, circleY, circleRadius, Math.PI * 0.8, Math.PI * 0.2);
  ctx.quadraticCurveTo(x + circleRadius * 0.3, y - pinHeight * 0.3, x, y);
  ctx.quadraticCurveTo(
    x - circleRadius * 0.3,
    y - pinHeight * 0.3,
    x - circleRadius * Math.sin(Math.PI * 0.3),
    circleY + circleRadius * Math.cos(Math.PI * 0.3),
  );
  ctx.closePath();
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fill();
  ctx.restore();

  // Pin shape: circle with pointed bottom
  ctx.beginPath();
  ctx.arc(x, circleY, circleRadius, Math.PI * 0.8, Math.PI * 0.2);
  ctx.quadraticCurveTo(x + circleRadius * 0.3, y - pinHeight * 0.3, x, y);
  ctx.quadraticCurveTo(
    x - circleRadius * 0.3,
    y - pinHeight * 0.3,
    x - circleRadius * Math.sin(Math.PI * 0.3),
    circleY + circleRadius * Math.cos(Math.PI * 0.3),
  );
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "white";
  ctx.lineWidth = size > 14 ? 3 : 2;
  ctx.stroke();

  // Number in the circle part
  ctx.fillStyle = "white";
  ctx.font = `bold ${size > 14 ? 14 : 12}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(orderNumber.toString(), x, circleY);
}

/**
 * Fetches a static map image with a single marker and returns it as a base64 data URL.
 */
export async function fetchMapImage(
  lat: number,
  lng: number,
  orderNumber: number,
  color: string = "#3b82f6",
): Promise<string | null> {
  const cacheKey = `${lat},${lng},${orderNumber},${color}`;
  if (mapImageCache.has(cacheKey)) {
    return mapImageCache.get(cacheKey)!;
  }

  try {
    const zoom = 15;
    // Smaller canvas = fewer tiles to fetch
    const width = 256;
    const height = 192;

    const { canvas, ctx } = await renderTilesToCanvas(
      lat,
      lng,
      zoom,
      width,
      height,
    );

    // Draw marker at center
    drawMarker(ctx, width / 2, height / 2, orderNumber, color, 14);

    const dataUrl = canvas.toDataURL("image/png");
    mapImageCache.set(cacheKey, dataUrl);
    return dataUrl;
  } catch (error) {
    console.warn("Failed to generate map image:", error);
    return null;
  }
}

/**
 * Fetches a static map image with multiple markers for all locations.
 */
export async function fetchOverviewMap(
  markers: MapMarker[],
  color: string = "#3b82f6",
): Promise<string | null> {
  if (markers.length === 0) return null;

  const cacheKey = `overview_${color}_${markers.map((m) => `${m.lat},${m.lng}`).join("_")}`;
  if (mapImageCache.has(cacheKey)) {
    return mapImageCache.get(cacheKey)!;
  }

  try {
    const width = 600;
    const height = 400;

    // Calculate bounds and center
    const bounds = calculateBounds(markers);
    const center = calculateCenter(bounds);

    // Calculate zoom level
    const zoom =
      markers.length > 1 ? calculateZoomToFit(bounds, width, height) : 15;

    const { canvas, ctx, centerWorldPixel } = await renderTilesToCanvas(
      center.lat,
      center.lng,
      zoom,
      width,
      height,
    );

    // Draw all markers
    for (const marker of markers) {
      const worldPixel = latLngToWorldPixel(marker.lat, marker.lng, zoom);
      const markerX = width / 2 + (worldPixel.x - centerWorldPixel.x);
      const markerY = height / 2 + (worldPixel.y - centerWorldPixel.y);
      drawMarker(ctx, markerX, markerY, marker.orderNumber, color);
    }

    const dataUrl = canvas.toDataURL("image/png");
    mapImageCache.set(cacheKey, dataUrl);
    return dataUrl;
  } catch (error) {
    console.warn("Failed to generate overview map image:", error);
    return null;
  }
}

/** Clears all cached maps and tiles */
export function clearMapCache(): void {
  mapImageCache.clear();
  tileCache.clear();
}
