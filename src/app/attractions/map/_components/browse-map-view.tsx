"use client";

import dynamic from "next/dynamic";
import { useCallback } from "react";

import { AttractionMapShell } from "~/app/_components/map/attraction-map-shell";
import { notifyMapExtensionSelection } from "~/lib/map/map-extension-bridge";
import { LoadErrorBanner } from "~/app/attractions/raw/_components/load-error-banner";
import { MapDynamicLoading, MapLoadingOverlay } from "~/lib/map/map-loading";
import type { AttractionSummary } from "~/types";

import { BrowseMapProvider, useBrowseMapContext } from "./browse-context";
import { BrowseToolbar } from "./toolbar/browse-toolbar";

const BrowseLeafletMap = dynamic(
  () => import("~/app/_components/map/browse-leaflet-map"),
  {
    ssr: false,
    loading: () => <MapDynamicLoading label="Loading map…" />,
  },
);

function BrowseMapContent() {
  const {
    attractions,
    selectedAttractionId,
    selectedAttractionDetail,
    markerMeta,
    selectAttraction,
    onHighlightChange,
    onDeleteAttraction,
  } = useBrowseMapContext();

  const handleMarkerClick = useCallback(
    (attraction: AttractionSummary) => {
      notifyMapExtensionSelection("browse", attraction);
      selectAttraction(attraction.id);
    },
    [selectAttraction],
  );

  return (
    <AttractionMapShell
      attractions={attractions}
      selectedAttractionId={selectedAttractionId}
      selectedAttractionDetail={selectedAttractionDetail}
      onAttractionSelect={selectAttraction}
      onHighlightChange={onHighlightChange}
      onDeleteAttraction={onDeleteAttraction}
      className="h-full w-full border-0 shadow-none"
    >
      {(panelHeight, attractionsMap) => (
        <BrowseLeafletMap
          attractions={attractions}
          attractionsMap={attractionsMap}
          selectedAttractionId={selectedAttractionId}
          panelHeight={panelHeight}
          onMarkerClick={handleMarkerClick}
          markerMeta={markerMeta}
        />
      )}
    </AttractionMapShell>
  );
}

function BrowseOverlays() {
  const { isLoading, isError, loadErrorMessage, retryLoad } = useBrowseMapContext();

  if (isError && loadErrorMessage) {
    return <LoadErrorBanner message={loadErrorMessage} onRetry={retryLoad} />;
  }

  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 z-1000 bg-white/60 backdrop-blur-sm">
      <MapLoadingOverlay label="Loading attractions…" />
    </div>
  );
}

export function BrowseMapView() {
  return (
    <BrowseMapProvider>
      <div className="relative h-full w-full" data-testid="browse-map-view">
        <BrowseOverlays />
        <BrowseToolbar />
        <BrowseMapContent />
      </div>
    </BrowseMapProvider>
  );
}
