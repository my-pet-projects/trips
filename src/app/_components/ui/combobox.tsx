"use client";

import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import * as React from "react";

import { cn } from "~/lib/utils";

const Combobox = ComboboxPrimitive.Root;

function ComboboxValue({ ...props }: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />;
}

function ComboboxInput({
  className,
  showTrigger = true,
  showClear = false,
  startAdornment,
  ...props
}: ComboboxPrimitive.Input.Props & {
  showTrigger?: boolean;
  showClear?: boolean;
  startAdornment?: React.ReactNode;
}) {
  return (
    <ComboboxPrimitive.InputGroup
      className={cn(
        "flex w-full items-center gap-1 rounded-lg border border-input bg-white px-2 transition-colors outline-none has-disabled:bg-input/50 has-focus:border-ring has-focus:ring-3 has-focus:ring-ring/50 has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20",
        className,
      )}
    >
      {startAdornment}
      <ComboboxPrimitive.Input
        className="min-w-0 flex-1 bg-transparent px-2 py-2 text-base outline-none placeholder:text-gray-400 disabled:cursor-not-allowed"
        {...props}
      />
      {showClear && (
        <ComboboxPrimitive.Clear
          data-slot="combobox-clear"
          className="rounded p-1 text-gray-400 hover:text-red-500"
          aria-label="Clear selection"
        >
          <XIcon className="size-4" />
        </ComboboxPrimitive.Clear>
      )}
      {showTrigger && (
        <ComboboxPrimitive.Trigger
          className="rounded p-1 text-gray-400 hover:text-gray-500"
          aria-label="Open options"
        >
          <ChevronDownIcon className="size-4" />
        </ComboboxPrimitive.Trigger>
      )}
    </ComboboxPrimitive.InputGroup>
  );
}

function ComboboxContent({
  className,
  side = "bottom",
  sideOffset = 8,
  align = "start",
  alignOffset = 0,
  anchor,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<
    ComboboxPrimitive.Positioner.Props,
    "side" | "align" | "sideOffset" | "alignOffset" | "anchor"
  >) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="isolate z-[1000]"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          data-chips={anchor ? "" : undefined}
          className={cn(
            "max-h-72 w-(--anchor-width) overflow-hidden rounded-lg border bg-white text-gray-800 shadow-md",
            className,
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

function ComboboxList({
  className,
  ...props
}: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn("max-h-60 overflow-y-auto p-1", className)}
      {...props}
    />
  );
}

function ComboboxItem({
  className,
  children,
  ...props
}: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-md py-2 pr-8 pl-2 text-sm outline-hidden select-none data-highlighted:bg-orange-50 data-selected:bg-orange-200 data-selected:text-orange-700 data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator className="absolute right-2 flex size-4 items-center justify-center">
        <CheckIcon className="size-4" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  );
}

function ComboboxEmpty({
  className,
  ...props
}: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        "hidden py-6 text-center text-sm text-gray-500 group-data-empty/combobox-content:flex",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxStatus({
  className,
  ...props
}: ComboboxPrimitive.Status.Props) {
  return (
    <ComboboxPrimitive.Status
      data-slot="combobox-status"
      className={cn("px-3 py-2 text-sm text-gray-500", className)}
      {...props}
    />
  );
}

function ComboboxChips({
  className,
  ...props
}: ComboboxPrimitive.Chips.Props) {
  return (
    <ComboboxPrimitive.Chips
      data-slot="combobox-chips"
      className={cn(
        "flex min-h-12 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-white px-2 py-1.5 focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-200 has-disabled:bg-input/50",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxChip({
  className,
  children,
  ...props
}: ComboboxPrimitive.Chip.Props) {
  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700",
        className,
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ChipRemove
        className="rounded-full p-0.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
        aria-label="Remove"
      >
        <XIcon className="size-3" />
      </ComboboxPrimitive.ChipRemove>
    </ComboboxPrimitive.Chip>
  );
}

function ComboboxChipsInput({
  className,
  ...props
}: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-chip-input"
      className={cn(
        "min-w-16 flex-1 bg-transparent px-1 py-2 text-base outline-none placeholder:text-gray-400",
        className,
      )}
      {...props}
    />
  );
}

function useComboboxAnchor() {
  return React.useRef<HTMLDivElement>(null);
}

export {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxStatus,
  ComboboxValue,
  useComboboxAnchor,
};
