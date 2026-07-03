import L from "leaflet";

import { buildPiePaths } from "./pie-paths";

export type ClusterSlice = { color: string; count: number };

export type ClusterIconOptions = {
  innerRadiusRatio?: number;
  dropShadow?: string;
  fallbackColor?: string;
};

export function createPieClusterIcon(
  cluster: L.MarkerCluster,
  getSlices: (cluster: L.MarkerCluster) => ClusterSlice[],
  options: ClusterIconOptions = {},
): L.DivIcon {
  const count = cluster.getChildCount();
  const size = count >= 100 ? 50 : count >= 10 ? 45 : 38;
  const r = size / 2;
  const pieR = r - 3;
  const innerR = Math.round(pieR * (options.innerRadiusRatio ?? 0.55));
  const fontSize = count >= 100 ? 13 : 12;
  const dropShadow = options.dropShadow ?? "drop-shadow(0 2px 6px rgba(0,0,0,0.3))";

  const slices = getSlices(cluster);
  const hasData = slices.some((slice) => slice.count > 0);
  const pie = hasData
    ? buildPiePaths(slices, r, r, pieR)
    : `<circle cx="${r}" cy="${r}" r="${pieR}" fill="${options.fallbackColor ?? "#0ea5e9"}"/>`;

  const html = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" style="filter:${dropShadow}">
    <circle cx="${r}" cy="${r}" r="${r}" fill="white"/>
    ${pie}
    <circle cx="${r}" cy="${r}" r="${innerR}" fill="white"/>
    <text x="${r}" y="${r}" text-anchor="middle" dominant-baseline="central" fill="#1f2937" font-weight="700" font-size="${fontSize}" font-family="system-ui,sans-serif">${count}</text>
  </svg>`;

  return L.divIcon({
    html,
    className: "marker-cluster",
    iconSize: L.point(size, size),
    iconAnchor: L.point(r, r),
  });
}
