"use client";

import { BrowseMap } from "~/app/_components/map/browse-map";
import { MapLoadingOverlay } from "~/lib/map/map-loading";

import { BrowseMapProvider, useBrowseMapContext } from "./browse-context";
import { BrowseToolbar } from "./toolbar/browse-toolbar";

function BrowseMapShell() {
  const {
    attractions,
    selectedAttractionId,
    selectedAttractionDetail,
    markerMeta,
    selectAttraction,
    onHighlightChange,
    onDeleteAttraction,
  } = useBrowseMapContext();

  return (
    <BrowseMap
      attractions={attractions}
      selectedAttractionId={selectedAttractionId}
      selectedAttractionDetail={selectedAttractionDetail}
      markerMeta={markerMeta}
      onAttractionSelect={selectAttraction}
      onHighlightChange={onHighlightChange}
      onDeleteAttraction={onDeleteAttraction}
      className="h-full w-full border-0 shadow-none"
    />
  );
}

function BrowseOverlays() {
  const { isLoading } = useBrowseMapContext();

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
      <div className="relative h-full w-full">
        <BrowseOverlays />
        <BrowseToolbar />
        <BrowseMapShell />
      </div>
    </BrowseMapProvider>
  );
}
