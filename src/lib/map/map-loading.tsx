"use client";

import { Spinner } from "~/app/_components/ui/spinner";

export function MapLoadingOverlay({ label = "Loading map…" }: { label?: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex items-center gap-2 text-center">
        <Spinner className="text-sky-600" />
        <p className="text-sm font-medium text-gray-600">{label}</p>
      </div>
    </div>
  );
}

export function MapInlineLoading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 whitespace-nowrap font-medium text-gray-700">
      <Spinner className="size-4 text-sky-600" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function MapDynamicLoading({ label = "Loading map…" }: { label?: string }) {
  return (
    <div className="flex h-full items-center justify-center text-gray-500">
      <p className="text-sm">{label}</p>
    </div>
  );
}
