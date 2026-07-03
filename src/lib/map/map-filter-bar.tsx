"use client";

import type { ReactNode } from "react";

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
    <>
      {filters.map(({ key, label, color, count }) => (
        <button
          type="button"
          key={key}
          data-testid={`map-filter-${key}`}
          disabled={disabled}
          onClick={() => onToggle(key)}
          className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium transition-opacity ${
            compact ? "gap-1 px-2.5 py-1.5 font-semibold" : ""
          } ${disabled ? "pointer-events-none opacity-25" : visible.has(key) ? "opacity-100" : compact ? "opacity-30" : "opacity-40"}`}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
          {label}
          <span
            className={`rounded-full bg-gray-100 px-1.5 py-0.5 text-gray-600 ${
              compact ? "bg-transparent px-0 py-0" : ""
            }`}
          >
            {count}
          </span>
        </button>
      ))}
    </>
  );
}

export type FilterGroup = {
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
};

function renderGroups(groups: FilterGroup[], compact: boolean) {
  return groups.map((group, index) => (
    <span key={index} className="contents">
      {index > 0 && <Divider compact={compact} />}
      <FilterPills
        filters={
          compact
            ? group.filters.map(({ key, color, count }) => ({ key, color, count }))
            : group.filters
        }
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
}: MapFilterBarProps) {
  return (
    <>
      <div className="absolute top-3 left-1/2 z-1000 hidden md:flex w-[calc(100%-1.5rem)] max-w-fit -translate-x-1/2 items-center gap-2 rounded-xl border border-gray-200 bg-white/95 px-4 py-2 shadow-md backdrop-blur-sm" data-testid="map-filter-bar-desktop">
        {desktopLeading}
        {desktopLeading && (desktopSummary ?? groups.length > 0) && <Divider />}
        {desktopSummary}
        {desktopSummary && groups.length > 0 && <Divider />}
        <div className="flex items-center gap-2">{renderGroups(groups, false)}</div>
      </div>

      {mobileTop && (
        <div className="absolute top-3 left-3 right-3 z-1000 md:hidden">{mobileTop}</div>
      )}

      <div className="absolute bottom-6 left-3 right-3 z-1000 md:hidden">
        <div className="flex items-center justify-center gap-1.5 rounded-2xl border border-gray-200 bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
          {renderGroups(groups, true)}
        </div>
      </div>
    </>
  );
}
