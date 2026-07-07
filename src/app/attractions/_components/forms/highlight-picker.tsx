"use client";

import { HighlightToggleGroup } from "~/app/_components/highlight-toggle-group";
import { Field, FieldLabel } from "~/app/_components/ui/field";
import type { AttractionHighlight } from "~/lib/validators/attraction";

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
    <Field>
      <FieldLabel className="text-sm font-medium text-gray-700">Highlight</FieldLabel>
      <HighlightToggleGroup
        value={value ?? null}
        onChange={onChange}
        compact={compact}
      />
    </Field>
  );
}
