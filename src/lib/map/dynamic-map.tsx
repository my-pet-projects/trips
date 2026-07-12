"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import { MapDynamicLoading } from "~/lib/map/map-loading";

/**
 * Client-only dynamic import for a Leaflet-backed map component, with a shared
 * loading placeholder. Leaflet touches `window`, so these must not be SSR'd.
 */
export function dynamicMap<P extends object>(
  loader: () => Promise<{ default: ComponentType<P> }>,
  label?: string,
): ComponentType<P> {
  return dynamic(loader, {
    ssr: false,
    loading: () => <MapDynamicLoading label={label} />,
  }) as ComponentType<P>;
}
