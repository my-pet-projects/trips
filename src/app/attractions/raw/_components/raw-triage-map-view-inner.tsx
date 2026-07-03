"use client";

import "~/lib/map/leaflet-styles";

import { MapLoadingOverlay } from "~/lib/map/map-loading";

import { LoadErrorBanner } from "./load-error-banner";
import { RawMapCanvas } from "./map/raw-map-canvas";
import { RawTriagePanel } from "./panel/raw-triage-panel";
import { RawTriageProvider, useRawTriageContext } from "./raw-triage-context";
import { TriageToolbar } from "./toolbar/triage-toolbar";

function TriageOverlays({ countryCode }: { countryCode?: string }) {
  const { isLoading, isLoadError, loadErrorMessage, retryLoad } = useRawTriageContext();

  return (
    <>
      {!countryCode && (
        <div className="absolute inset-0 z-1000 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <p className="text-gray-500">Select a country to start triaging</p>
        </div>
      )}
      {isLoading && (
        <div className="absolute inset-0 z-1000 bg-white/60 backdrop-blur-sm">
          <MapLoadingOverlay label="Loading attractions…" />
        </div>
      )}
      {isLoadError && loadErrorMessage && (
        <LoadErrorBanner message={loadErrorMessage} onRetry={retryLoad} />
      )}
    </>
  );
}

export function RawTriageMapViewInner({ countryCode }: { countryCode?: string }) {
  return (
    <RawTriageProvider countryCode={countryCode}>
      <div className="relative h-full w-full" data-testid="raw-map-view">
        <TriageOverlays countryCode={countryCode} />
        <TriageToolbar countryCode={countryCode} />
        <RawTriagePanel />
        <RawMapCanvas countryCode={countryCode} />
      </div>
    </RawTriageProvider>
  );
}
