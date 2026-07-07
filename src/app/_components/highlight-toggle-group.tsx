"use client";

import type { LucideIcon } from "lucide-react";
import { SkipForward, Star, ThumbsUp } from "lucide-react";

import { Toggle, ToggleGroup } from "~/app/_components/ui/toggle-group";
import type { AttractionHighlight } from "~/lib/validators/attraction";
import { cn } from "~/lib/utils";

export type HighlightValue = AttractionHighlight | null;

export const HIGHLIGHT_OPTIONS: {
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

type HighlightToggleGroupProps = {
  value: HighlightValue;
  onChange: (value: HighlightValue) => void;
  compact?: boolean;
  className?: string;
};

export function HighlightToggleGroup({
  value,
  onChange,
  compact = false,
  className,
}: HighlightToggleGroupProps) {
  return (
    <ToggleGroup
      multiple
      value={value ? [value] : []}
      onValueChange={(values) => {
        if (values.length === 0) {
          onChange(null);
          return;
        }

        onChange(values[values.length - 1] ?? null);
      }}
      className={className}
    >
      {HIGHLIGHT_OPTIONS.map(
        ({ value: optionValue, label, icon: Icon, activeClass, idleHoverClass }) => (
          <Toggle
            key={optionValue}
            value={optionValue}
            className={cn(
              compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
              value === optionValue
                ? activeClass
                : `border-gray-200 bg-white text-gray-600 ${idleHoverClass}`,
              "data-pressed:border-inherit data-pressed:bg-inherit data-pressed:text-inherit",
            )}
          >
            <Icon className={compact ? "h-4 w-4" : "h-4 w-4"} />
            {label}
          </Toggle>
        ),
      )}
    </ToggleGroup>
  );
}
