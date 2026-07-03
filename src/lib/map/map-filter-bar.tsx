"use client";

import type { ReactNode } from "react";

import { FilterPills, type MapFilterPill } from "./filter-pills";

function Divider({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`${compact ? "mx-0.5" : "mx-1"} h-4 w-px shrink-0 bg-gray-200`} />
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
      <div className="absolute top-3 left-1/2 z-1000 hidden md:flex w-[calc(100%-1.5rem)] max-w-fit -translate-x-1/2 items-center gap-2 rounded-xl border border-gray-200 bg-white/95 px-4 py-2 shadow-md backdrop-blur-sm">
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
