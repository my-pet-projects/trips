import type { ExistingAttraction, RawAttraction } from "~/types";

import {
  type AttractionHighlightKey,
  toAttractionHighlightKey,
} from "~/lib/map/marker-meta";

import { normalizeMapCoords } from "./coords";

export type StatusFilter = "pending" | "rejected" | "duplicated";
export type RawStatus = StatusFilter | "approved";
export type ApproveHighlight = "must_see" | "recommended";
export type HighlightIconKey = AttractionHighlightKey;

export type RawMapAttraction = RawAttraction & ReturnType<typeof normalizeMapCoords>;
export type ExistingMapAttraction = ExistingAttraction &
  ReturnType<typeof normalizeMapCoords>;

export type TriageSelection =
  | { kind: "raw"; attraction: RawMapAttraction }
  | { kind: "existing"; attraction: ExistingMapAttraction };

export type StatusCounts = {
  pending: number;
  rejected: number;
  duplicated: number;
};

export type HighlightCounts = Record<HighlightIconKey, number>;

export type TriageMapQueryInput = {
  countryCode: string;
};

export { toAttractionHighlightKey as toHighlightIconKey };

/** Normalize a raw attraction's status string to a discrete status key. */
export function toRawStatusKey(status: string): StatusFilter {
  if (status === "rejected") return "rejected";
  if (status === "duplicated") return "duplicated";
  return "pending";
}
