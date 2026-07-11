import L from "leaflet";

import {
  DEFAULT_CIRCLE_COLOR,
  type CircleTaggedMarker,
} from "./marker-icons/circle";
import { buildPiePaths } from "./pie-paths";

type ClusterSlice = { color: string; count: number };

/**
 * The one cluster icon used by every map: a donut pie whose slices come from
 * the `_metaTag`/`_metaColor` tags that {@link useMarkerLayer} stamps on each
 * marker, with the child count in the center.
 */
export function createTaggedClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const tally = new Map<string, ClusterSlice>();
  for (const marker of cluster.getAllChildMarkers()) {
    const tagged = marker as CircleTaggedMarker;
    if (!tagged._metaTag) continue;
    const entry = tally.get(tagged._metaTag);
    if (entry) entry.count++;
    else
      tally.set(tagged._metaTag, {
        color: tagged._metaColor ?? DEFAULT_CIRCLE_COLOR,
        count: 1,
      });
  }
  const slices = [...tally.values()];

  const count = cluster.getChildCount();
  const size = count >= 100 ? 50 : count >= 10 ? 45 : 38;
  const r = size / 2;
  const pieR = r - 3;
  const innerR = Math.round(pieR * 0.5);
  const fontSize = count >= 100 ? 13 : 12;

  const pie = slices.some((slice) => slice.count > 0)
    ? buildPiePaths(slices, r, r, pieR)
    : `<circle cx="${r}" cy="${r}" r="${pieR}" fill="${DEFAULT_CIRCLE_COLOR}"/>`;

  const html = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" style="filter:drop-shadow(0 2px 6px rgba(0,0,0,0.35))">
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
