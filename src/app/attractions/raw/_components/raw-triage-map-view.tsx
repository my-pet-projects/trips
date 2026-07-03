"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer } from "react-leaflet";

import { MapLoadingOverlay } from "~/lib/map/map-loading";

import { LoadErrorBanner } from "./load-error-banner";
import { RawTriageMap } from "./map/markers-layer";
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

function TriageMapShell({ countryCode }: { countryCode?: string }) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={4}
      scrollWheelZoom
      style={{ height: "100%", width: "100%", zIndex: 0 }}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <RawTriageMap countryCode={countryCode} />
    </MapContainer>
  );
}

export function RawTriageMapView({ countryCode }: { countryCode?: string }) {
  return (
    <RawTriageProvider countryCode={countryCode}>
      <div className="relative h-full w-full">
        <TriageOverlays countryCode={countryCode} />
        <TriageToolbar countryCode={countryCode} />
        <RawTriagePanel />
        <TriageMapShell countryCode={countryCode} />
      </div>
    </RawTriageProvider>
  );
}
