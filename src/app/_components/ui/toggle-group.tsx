"use client";

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import * as React from "react";

import { cn } from "~/lib/utils";

function ToggleGroup<Value extends string>({
  className,
  ...props
}: ToggleGroupPrimitive.Props<Value>) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}

function Toggle<Value extends string>({
  className,
  ...props
}: TogglePrimitive.Props<Value>) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white font-medium text-gray-600 transition-colors hover:bg-gray-50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-pressed:border-gray-300 data-pressed:bg-gray-100 data-pressed:text-gray-900",
        className,
      )}
      {...props}
    />
  );
}

export { Toggle, ToggleGroup };
