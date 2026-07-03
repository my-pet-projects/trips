"use client";

export interface MapFilterPill {
  key: string;
  label?: string;
  color: string;
  count: number;
}

interface FilterPillsProps {
  filters: MapFilterPill[];
  visible: Set<string>;
  onToggle: (key: string) => void;
  compact?: boolean;
  disabled?: boolean;
}

export function FilterPills({
  filters,
  visible,
  onToggle,
  compact = false,
  disabled = false,
}: FilterPillsProps) {
  return (
    <>
      {filters.map(({ key, label, color, count }) => (
        <button
          type="button"
          key={key}
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
