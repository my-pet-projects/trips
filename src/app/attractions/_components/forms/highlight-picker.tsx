"use client";

import type { LucideIcon } from "lucide-react";
import { SkipForward, Star, ThumbsUp } from "lucide-react";

import { Label } from "~/app/_components/ui/label";
import type { AttractionHighlight } from "~/lib/validators/attraction";

const HIGHLIGHT_OPTIONS: {
  value: AttractionHighlight;
  label: string;
  icon: LucideIcon;
  activeClass: string;
  idleHoverClass: string;
}[] = [
  {
    value: "must_see",
    label: "Must see",
    icon: Star,
    activeClass: "border-amber-400 bg-amber-50 text-amber-700",
    idleHoverClass: "hover:border-amber-300 hover:bg-amber-50/50",
  },
  {
    value: "recommended",
    label: "Recommended",
    icon: ThumbsUp,
    activeClass: "border-teal-400 bg-teal-50 text-teal-700",
    idleHoverClass: "hover:border-teal-300 hover:bg-teal-50/50",
  },
  {
    value: "skip",
    label: "Skip",
    icon: SkipForward,
    activeClass: "border-red-300 bg-red-50 text-red-600",
    idleHoverClass: "hover:border-red-200 hover:bg-red-50/50",
  },
];

type HighlightPickerProps = {
  value: AttractionHighlight | null | undefined;
  onChange: (value: AttractionHighlight | null) => void;
  compact?: boolean;
};

export function HighlightPicker({
  value,
  onChange,
  compact = false,
}: HighlightPickerProps) {
  return (
    <div>
      <Label className="text-sm font-medium text-gray-700">Highlight</Label>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {HIGHLIGHT_OPTIONS.map(
          ({ value: optionValue, label, icon: Icon, activeClass, idleHoverClass }) => {
            const isActive = value === optionValue;
            return (
              <button
                key={optionValue}
                type="button"
                onClick={() => onChange(isActive ? null : optionValue)}
                className={`flex items-center gap-2 rounded-lg border font-medium transition-colors ${
                  compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
                } ${
                  isActive
                    ? activeClass
                    : `border-gray-200 bg-white text-gray-600 ${idleHoverClass}`
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          },
        )}
      </div>
    </div>
  );
}
