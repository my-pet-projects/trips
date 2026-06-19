import L from "leaflet";

function createPinIcon(color: string, size = 32) {
  const s = size;
  const outer = Math.round(s * 1.4);
  const halfOuter = outer / 2;
  const pinOffset = (outer - s) / 2;
  const anchorY = outer * 0.9;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${outer}' height='${outer}' viewBox='0 0 ${outer} ${outer}'>
<g transform='translate(${pinOffset},${pinOffset})'>
  <svg width='${s}' height='${s}' viewBox='0 0 24 24'>
    <path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z' fill='${color}' filter='drop-shadow(0 2px 3px rgba(0,0,0,0.3))'/>
    <circle cx='12' cy='9' r='3.2' fill='white' fill-opacity='0.9'/>
    <circle cx='12' cy='9' r='1.2' fill='${color}'/>
  </svg>
</g></svg>`;
  return L.divIcon({
    className: "leaflet-raw-icon",
    html: svg,
    iconSize: [outer, outer],
    iconAnchor: [halfOuter, anchorY],
    popupAnchor: [0, -anchorY],
    tooltipAnchor: [0, -anchorY],
  });
}

type IconKey = "pending" | "rejected" | "duplicated" | "existing";

const ICON_CONFIGS: Record<IconKey, { color: string; size?: number }> = {
  pending: { color: "#f59e0b" },
  rejected: { color: "#ef4444", size: 24 },
  duplicated: { color: "#a855f7", size: 24 },
  existing: { color: "#3b82f6", size: 28 },
};

// Must match ICON_CONFIGS colors above
export const STATUS_COLOR: Record<string, string> = Object.fromEntries(
  Object.entries(ICON_CONFIGS).map(([k, v]) => [k, v.color]),
);

const iconCache: Partial<Record<IconKey, L.DivIcon>> = {};

export function getIcon(status: IconKey): L.DivIcon {
  const cfg = ICON_CONFIGS[status];
  return (iconCache[status] ??= createPinIcon(cfg.color, cfg.size));
}

export type TaggedMarker = L.Marker & { markerStatus: string };

function buildPiePaths(
  slices: { color: string; count: number }[],
  cx: number,
  cy: number,
  r: number,
): string {
  const total = slices.reduce((s, sl) => s + sl.count, 0);
  if (total === 0) return "";
  const nonEmpty = slices.filter((sl) => sl.count > 0);
  if (nonEmpty.length === 1) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${nonEmpty[0]!.color}"/>`;
  }
  let paths = "";
  let angle = -Math.PI / 2;
  for (const sl of nonEmpty) {
    const sweep = (sl.count / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    paths += `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${sweep > Math.PI ? 1 : 0},1 ${x2},${y2} Z" fill="${sl.color}"/>`;
  }
  return paths;
}

export function createClusterIcon(cluster: L.MarkerCluster) {
  const count = cluster.getChildCount();
  const size = count >= 100 ? 50 : count >= 10 ? 45 : 38;
  const r = size / 2;
  const pieR = r - 3;
  const innerR = Math.round(pieR * 0.5);
  const fontSize = count >= 100 ? 13 : 12;

  const tally: Record<string, number> = {};
  for (const m of cluster.getAllChildMarkers()) {
    const status = (m as TaggedMarker).markerStatus ?? "existing";
    tally[status] = (tally[status] ?? 0) + 1;
  }

  const slices = ["pending", "rejected", "duplicated", "existing"].map(
    (key) => ({
      color: STATUS_COLOR[key]!,
      count: tally[key] ?? 0,
    }),
  );

  const pie = buildPiePaths(slices, r, r, pieR);

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
