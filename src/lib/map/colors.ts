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

export type RawStatusKey = "pending" | "rejected" | "duplicated";

export const RAW_STATUS_COLORS: Record<RawStatusKey, MapColorDef> = {
  pending: { hex: "#f59e0b", pill: "bg-amber-400", label: "Pending" },
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
