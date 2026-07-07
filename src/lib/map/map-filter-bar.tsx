"use client";

import type { ReactNode } from "react";

import { Toggle, ToggleGroup } from "~/app/_components/ui/toggle-group";
import { Badge } from "~/app/_components/ui/badge";
import { cn } from "~/lib/utils";

export interface MapFilterPill {
  key: string;
  label?: string;
  color: string;
  count: number;
}

function Divider({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`${compact ? "mx-0.5" : "mx-1"} h-4 w-px shrink-0 bg-gray-200`} />
  );
}

function FilterPills({
  filters,
  visible,
  onToggle,
  compact = false,
  disabled = false,
}: {
  filters: MapFilterPill[];
  visible: Set<string>;
  onToggle: (key: string) => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  return (
    <ToggleGroup
      multiple
      disabled={disabled}
      value={Array.from(visible)}
      onValueChange={(values) => {
        const nextVisible = new Set(values);
        for (const { key } of filters) {
          if (visible.has(key) !== nextVisible.has(key)) {
            onToggle(key);
          }
        }
      }}
      className="gap-1"
    >
      {filters.map(({ key, label, color, count }) => (
        <Toggle
          key={key}
          value={key}
          data-testid={`map-filter-${key}`}
          className={cn(
            "flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border-0 bg-transparent px-2 py-1 text-xs font-medium shadow-none transition-opacity hover:bg-transparent",
            compact ? "gap-1 px-2 py-1 font-semibold" : "gap-1.5 px-2.5",
            disabled
              ? "pointer-events-none opacity-25"
              : visible.has(key)
                ? "opacity-100"
                : compact
                  ? "opacity-30"
                  : "opacity-40",
            "data-pressed:border-0 data-pressed:bg-transparent data-pressed:text-inherit",
          )}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
          {label}
          <Badge
            variant="muted"
            className={cn(
              "px-1.5 py-0 text-[10px] font-semibold",
              compact && "bg-transparent px-0 py-0 text-inherit",
            )}
          >
            {count}
          </Badge>
        </Toggle>
      ))}
    </ToggleGroup>
  );
}

export type FilterGroup = {
  id: string;
  filters: MapFilterPill[];
  visible: Set<string>;
  onToggle: (key: string) => void;
  disabled?: boolean;
};

type MapFilterBarProps = {
  desktopLeading?: ReactNode;
  desktopSummary?: ReactNode;
  groups: FilterGroup[];
  mobileTop?: ReactNode;
  compactDesktop?: boolean;
};

function renderGroups(groups: FilterGroup[], compact: boolean) {
  return groups.map((group, index) => (
    <span key={group.id} className="contents">
      {index > 0 && <Divider compact={compact} />}
      <FilterPills
        filters={group.filters}
        visible={group.visible}
        onToggle={group.onToggle}
        disabled={group.disabled}
        compact={compact}
      />
    </span>
  ));
}

export function MapFilterBar({
  desktopLeading,
  desktopSummary,
  groups,
  mobileTop,
  compactDesktop = false,
}: MapFilterBarProps) {
  return (
    <>
      <div
        className="absolute top-3 inset-x-3 z-1000 hidden justify-center md:flex"
        data-testid="map-filter-bar-desktop"
      >
        <div className="flex max-w-full flex-nowrap items-center gap-2 overflow-x-auto rounded-xl border border-gray-200 bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-sm">
          {desktopLeading}
          {desktopLeading && (desktopSummary ?? groups.length > 0) && (
            <Divider compact={compactDesktop} />
          )}
          {desktopSummary}
          {desktopSummary && groups.length > 0 && <Divider compact={compactDesktop} />}
          <div className="flex flex-nowrap items-center gap-1.5">
            {renderGroups(groups, compactDesktop)}
          </div>
        </div>
      </div>

      {mobileTop && (
        <div className="absolute top-3 left-3 right-3 z-1000 md:hidden">{mobileTop}</div>
      )}

      <div className="absolute bottom-6 left-3 right-3 z-1000 md:hidden">
        <div className="flex items-center justify-center gap-1.5 overflow-x-auto rounded-2xl border border-gray-200 bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
          {renderGroups(groups, true)}
        </div>
      </div>
    </>
  );
}
