"use client";

import type { BaseAttractionMapProps } from "~/app/_components/map/base-attraction-map";
import { MapStatusOverlays } from "~/app/_components/map/map-status-overlays";
import { useMarkerSelect } from "~/app/_components/map/use-marker-select";
import { AttractionMapToolbar } from "~/lib/map/attraction-map-toolbar";
import { dynamicMap } from "~/lib/map/dynamic-map";

import { useBrowseMap } from "./hooks/use-browse-map";

const BaseAttractionMap = dynamicMap<BaseAttractionMapProps>(
  () => import("~/app/_components/map/base-attraction-map"),
);

export function BrowseMap() {
  const {
    isLoading,
    isError,
    loadErrorMessage,
    retryLoad,
    attractions,
    filters,
    selectedAttractionId,
    selectedAttractionDetail,
    selectAttraction,
    markerMeta,
    onHighlightChange,
    onDeleteAttraction,
  } = useBrowseMap();

  const handleMarkerClick = useMarkerSelect("map-browse", selectAttraction);

  return (
    <div className="relative h-full w-full" data-testid="browse-map-view">
      <MapStatusOverlays
        isLoading={isLoading}
        isError={isError}
        errorMessage={loadErrorMessage}
        onRetry={retryLoad}
      />
      <AttractionMapToolbar filters={filters} showVerifiedFilter />
      <BaseAttractionMap
        attractions={attractions}
        selectedAttractionId={selectedAttractionId}
        selectedAttractionDetail={selectedAttractionDetail}
        onAttractionSelect={selectAttraction}
        onHighlightChange={onHighlightChange}
        onDeleteAttraction={onDeleteAttraction}
        markers={{
          onClick: handleMarkerClick,
          enableClustering: true,
          meta: markerMeta,
        }}
        className="h-full w-full border-0 shadow-none"
      />
    </div>
  );
}
