export type AttractionHighlightKey = "must_see" | "recommended" | "skip" | "none";

export type MapColorDef = {
  hex: string;
  pill: string;
  label: string;
  button: string;
};

export const HIGHLIGHT_COLORS: Record<AttractionHighlightKey, MapColorDef> = {
  must_see: {
    hex: "#f59e0b",
    pill: "bg-amber-400",
    label: "Must see",
    button:
      "border-amber-500 bg-amber-500 text-white hover:border-amber-600 hover:bg-amber-600",
  },
  recommended: {
    hex: "#14b8a6",
    pill: "bg-teal-500",
    label: "Recommended",
    button: "border-teal-500 bg-teal-500 text-white hover:border-teal-600 hover:bg-teal-600",
  },
  skip: {
    hex: "#ef4444",
    pill: "bg-red-500",
    label: "Skip",
    button: "border-red-500 bg-red-500 text-white hover:border-red-600 hover:bg-red-600",
  },
  none: {
    hex: "#ffffff",
    pill: "border-2 border-slate-400 bg-white",
    label: "Unrated",
    button:
      "border-2 border-slate-400 bg-white text-gray-700 hover:border-slate-500 hover:bg-gray-50",
  },
};

/** Visible outline for white unrated markers on the map. */
export const UNRATED_MARKER_BORDER = "#9ca3af";

export const VERIFIED_COLOR: MapColorDef = {
  hex: "#10b981",
  pill: "bg-emerald-500",
  label: "Verified",
  button:
    "border-emerald-500 bg-emerald-500 text-white hover:border-emerald-600 hover:bg-emerald-600",
};

/** Default plan block / PDF map marker color when no day color is set. */
export const DEFAULT_BLOCK_COLOR = "#3b82f6";

export const PLAN_BLOCK_PALETTE = [
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

export function getPlanBlockColor(index: number): string {
  return PLAN_BLOCK_PALETTE[index % PLAN_BLOCK_PALETTE.length]!;
}

export type RawStatusKey = "pending" | "rejected" | "duplicated";

export const RAW_STATUS_COLORS: Record<RawStatusKey, MapColorDef> = {
  pending: {
    hex: "#9ca3af",
    pill: "bg-slate-400",
    label: "Pending review",
    button:
      "border-slate-400 bg-slate-400 text-white hover:border-slate-500 hover:bg-slate-500",
  },
  rejected: {
    hex: "#ef4444",
    pill: "bg-red-500",
    label: "Rejected",
    button: "border-red-500 bg-red-500 text-white hover:border-red-600 hover:bg-red-600",
  },
  duplicated: {
    hex: "#a855f7",
    pill: "bg-purple-500",
    label: "Duplicated",
    button:
      "border-purple-500 bg-purple-500 text-white hover:border-purple-600 hover:bg-purple-600",
  },
};

/** Marker fill color for any raw-status or highlight key (map markers + cluster pies). */
export const MARKER_STATUS_COLORS: Record<
  RawStatusKey | AttractionHighlightKey,
  string
> = {
  pending: RAW_STATUS_COLORS.pending.hex,
  rejected: RAW_STATUS_COLORS.rejected.hex,
  duplicated: RAW_STATUS_COLORS.duplicated.hex,
  must_see: HIGHLIGHT_COLORS.must_see.hex,
  recommended: HIGHLIGHT_COLORS.recommended.hex,
  skip: HIGHLIGHT_COLORS.skip.hex,
  none: HIGHLIGHT_COLORS.none.hex,
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
