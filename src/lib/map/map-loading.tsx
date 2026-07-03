"use client";

export function MapLoadingOverlay({ label = "Loading map…" }: { label?: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-sky-600" />
        <p className="text-sm font-medium text-gray-600">{label}</p>
      </div>
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
