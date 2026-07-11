"use client";

import type { ReactNode } from "react";

import { MapLoadingOverlay } from "~/lib/map/map-loading";

import { LoadErrorBanner } from "./load-error-banner";

type MapStatusOverlaysProps = {
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string | null;
  onRetry: () => void;
  loadingLabel?: string;
  /** Extra overlay content (e.g. an empty-state prompt) rendered above the rest. */
  children?: ReactNode;
};

/**
 * Shared loading scrim + load-error banner for the map surfaces (browse, raw
 * triage). Render this as an absolutely-positioned sibling of the map canvas.
 */
export function MapStatusOverlays({
  isLoading,
  isError,
  errorMessage,
  onRetry,
  loadingLabel = "Loading attractions…",
  children,
}: MapStatusOverlaysProps) {
  return (
    <>
      {children}
      {isLoading && (
        <div className="absolute inset-0 z-1010 bg-white/60 backdrop-blur-sm">
          <MapLoadingOverlay label={loadingLabel} />
        </div>
      )}
      {isError && errorMessage && (
        <LoadErrorBanner message={errorMessage} onRetry={onRetry} />
      )}
    </>
  );
}
