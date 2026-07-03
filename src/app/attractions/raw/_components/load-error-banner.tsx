"use client";

import { AlertCircle } from "lucide-react";

interface LoadErrorBannerProps {
  message: string;
  onRetry: () => void;
}

export function LoadErrorBanner({ message, onRetry }: LoadErrorBannerProps) {
  return (
    <div className="absolute top-16 left-3 right-3 z-1001 md:top-20 md:left-1/2 md:right-auto md:w-full md:max-w-md md:-translate-x-1/2">
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 shadow-md">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-red-900">Failed to load data</p>
          <p className="mt-1 text-xs text-red-700">{message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
