import type { AttractionSummary } from "~/types";

import {
  DEFAULT_DAY_COLOR,
  HIGHLIGHT_COLORS,
  VERIFIED_COLOR,
  type AttractionHighlightKey,
} from "./colors";

export type { AttractionHighlightKey };

export type MarkerMeta = { color: string; tag: string; isVerified: boolean };

export const ATTRACTION_MARKER_COLORS = {
  must_see: HIGHLIGHT_COLORS.must_see.hex,
  recommended: HIGHLIGHT_COLORS.recommended.hex,
  skip: HIGHLIGHT_COLORS.skip.hex,
  verified: VERIFIED_COLOR.hex,
  default: HIGHLIGHT_COLORS.none.hex,
} as const;

export function toAttractionHighlightKey(
  highlight: string | null | undefined,
): AttractionHighlightKey {
  if (highlight === "must_see" || highlight === "recommended" || highlight === "skip") {
    return highlight;
  }
  return "none";
}

export function isAttractionVerified(attraction: { isVerified?: boolean | null }): boolean {
  return attraction.isVerified === true;
}

export function getCircleMarkerColor(
  attractionId: number,
  markerMeta: Map<number, MarkerMeta> | undefined,
  attractionToDayMap: Map<number, number>,
  dayColors: Map<number, string>,
): string {
  const attractionDayId = attractionToDayMap.get(attractionId);
  if (attractionDayId !== undefined) {
    return dayColors.get(attractionDayId) ?? DEFAULT_DAY_COLOR;
  }
  return markerMeta?.get(attractionId)?.color ?? ATTRACTION_MARKER_COLORS.default;
}

export function buildAttractionMarkerMeta(
  attractions: Pick<AttractionSummary, "id" | "highlight" | "isVerified">[],
): Map<number, MarkerMeta> {
  const map = new Map<number, MarkerMeta>();
  for (const a of attractions) {
    const key = toAttractionHighlightKey(a.highlight);
    const color = ATTRACTION_MARKER_COLORS[key === "none" ? "default" : key];

    map.set(a.id, {
      color,
      tag: key === "none" ? "default" : key,
      isVerified: isAttractionVerified(a),
    });
  }
  return map;
}
