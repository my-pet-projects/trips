"use client";

import { MapStatusOverlays } from "~/app/_components/map/map-status-overlays";
import { dynamicMap } from "~/lib/map/dynamic-map";

import { useRawTriage } from "./hooks/use-raw-triage";
import type { RawMapProps } from "./map/raw-map";
import { RawTriagePanel } from "./panel/raw-triage-panel";
import { TriageToolbar } from "./toolbar/triage-toolbar";

const RawMap = dynamicMap<RawMapProps>(() =>
  import("./map/raw-map").then((m) => ({ default: m.RawMap })),
);

export function RawTriageMap({ countryCode }: { countryCode?: string }) {
  const triage = useRawTriage(countryCode);

  return (
    <div className="relative h-full w-full" data-testid="raw-map-view">
      <MapStatusOverlays
        isLoading={triage.isLoading}
        isError={triage.isLoadError}
        errorMessage={triage.loadErrorMessage}
        onRetry={triage.retryLoad}
      >
        {!countryCode && (
          <div className="absolute inset-0 z-1000 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <p className="text-gray-500">Select a country to start triaging</p>
          </div>
        )}
      </MapStatusOverlays>

      <TriageToolbar
        countryCode={countryCode}
        counts={triage.counts}
        highlightCounts={triage.highlightCounts}
        visibleStatuses={triage.visibleStatuses}
        toggleStatus={triage.toggleStatus}
        visibleHighlights={triage.visibleHighlights}
        toggleHighlight={triage.toggleHighlight}
      />

      <RawTriagePanel
        selection={triage.selection}
        isLoading={triage.isLoading}
        clearSelection={triage.clearSelection}
        isMutating={triage.isMutating}
        onApprove={triage.onApprove}
        onReject={triage.onReject}
        onDuplicated={triage.onDuplicated}
      />

      <RawMap
        countryCode={countryCode}
        allPoints={triage.allPoints}
        clearSelection={triage.clearSelection}
        rawAttractions={triage.rawAttractions}
        existing={triage.existing}
        selection={triage.selection}
        selectRaw={triage.selectRaw}
        selectExisting={triage.selectExisting}
        resolveExistingId={triage.resolveExistingId}
        promotionMapRef={triage.promotionMapRef}
      />
    </div>
  );
}
