export type AttractionHighlightKey = "must_see" | "recommended" | "skip" | "none";

export type MapColorDef = {
  hex: string;
  pill: string;
  label: string;
};

export const HIGHLIGHT_COLORS: Record<AttractionHighlightKey, MapColorDef> = {
  must_see: { hex: "#f59e0b", pill: "bg-amber-400", label: "Must see" },
  recommended: { hex: "#38bdf8", pill: "bg-sky-400", label: "Recommended" },
  skip: { hex: "#ef4444", pill: "bg-red-500", label: "Skip" },
  none: { hex: "#9ca3af", pill: "bg-slate-400", label: "No highlight" },
};

export const VERIFIED_COLOR: MapColorDef = {
  hex: "#10b981",
  pill: "bg-emerald-500",
  label: "Verified",
};

/** Default itinerary day / PDF map marker color when no day color is set. */
export const DEFAULT_DAY_COLOR = "#3b82f6";

export const ITINERARY_DAY_PALETTE = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#14b8a6",
  "#a855f7",
  "#84cc16",
  "#f43f5e",
] as const;

export function getItineraryDayColor(index: number): string {
  return ITINERARY_DAY_PALETTE[index % ITINERARY_DAY_PALETTE.length]!;
}

export type RawStatusKey = "pending" | "rejected" | "duplicated";

export const RAW_STATUS_COLORS: Record<RawStatusKey, MapColorDef> = {
  pending: { hex: "#6366f1", pill: "bg-indigo-500", label: "Pending" },
  rejected: { hex: "#ef4444", pill: "bg-red-500", label: "Rejected" },
  duplicated: { hex: "#a855f7", pill: "bg-purple-500", label: "Duplicated" },
};

export const HIGHLIGHT_FILTER_PILLS = (
  Object.entries(HIGHLIGHT_COLORS) as [AttractionHighlightKey, MapColorDef][]
).map(([key, { label, pill }]) => ({ key, label, color: pill }));

export const STATUS_FILTER_PILLS = (
  Object.entries(RAW_STATUS_COLORS) as [RawStatusKey, MapColorDef][]
).map(([key, { label, pill }]) => ({ key, label, color: pill }));

export const VERIFIED_FILTER_PILL = {
  key: "verified",
  label: VERIFIED_COLOR.label,
  color: VERIFIED_COLOR.pill,
};
