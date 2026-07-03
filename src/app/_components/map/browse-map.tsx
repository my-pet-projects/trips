"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { MarkerMeta } from "~/lib/map/marker-meta";
import type { AttractionDetail, AttractionSummary } from "~/types";

import BrowseLeafletMap from "./browse-leaflet-map";
import { AttractionDetailPanel } from "./attraction-detail-panel";

export type BrowseMapProps = {
  attractions: AttractionSummary[];
  selectedAttractionId: number | null;
  selectedAttractionDetail?: AttractionDetail | null;
  markerMeta: Map<number, MarkerMeta>;
  onAttractionSelect: (attractionId: number | null) => void;
  onHighlightChange?: (
    attractionId: number,
    highlight: "must_see" | "recommended" | "skip" | null,
  ) => void;
  onDeleteAttraction?: (attractionId: number) => void;
  className?: string;
};

export function BrowseMap({
  attractions,
  selectedAttractionId,
  selectedAttractionDetail,
  markerMeta,
  onAttractionSelect,
  onHighlightChange,
  onDeleteAttraction,
  className,
}: BrowseMapProps) {
  const attractionsMap = useMemo(
    () => new Map(attractions.map((a) => [a.id, a])),
    [attractions],
  );

  const [panelAttraction, setPanelAttraction] = useState<AttractionDetail | null>(null);
  const [panelHeight, setPanelHeight] = useState(0);

  useEffect(() => {
    if (selectedAttractionDetail) {
      setPanelAttraction(selectedAttractionDetail);
    } else if (selectedAttractionId) {
      const fromMap = attractionsMap.get(selectedAttractionId);
      if (fromMap && "city" in fromMap) {
        setPanelAttraction(fromMap as AttractionDetail);
      }
    }
  }, [selectedAttractionDetail, selectedAttractionId, attractionsMap]);

  const handleMarkerClick = useCallback(
    (attraction: AttractionSummary) => {
      onAttractionSelect(attraction.id);
    },
    [onAttractionSelect],
  );

  const handleClose = useCallback(() => {
    onAttractionSelect(null);
  }, [onAttractionSelect]);

  const browseStatus = useMemo(
    () => ({
      dayId: undefined,
      isInAnyDay: false,
      isInSelectedDay: false,
    }),
    [],
  );

  return (
    <div
      className={`relative h-full overflow-hidden ${className ?? "rounded-lg border border-gray-200 bg-white shadow-sm"}`}
    >
      <BrowseLeafletMap
        attractions={attractions}
        attractionsMap={attractionsMap}
        selectedAttractionId={selectedAttractionId}
        panelHeight={panelHeight}
        onMarkerClick={handleMarkerClick}
        markerMeta={markerMeta}
      />

      {panelAttraction && (
        <AttractionDetailPanel
          attraction={panelAttraction}
          attractionStatus={browseStatus}
          selectedDayId={null}
          isOpen={!!selectedAttractionId}
          onClose={handleClose}
          onClosed={() => setPanelAttraction(null)}
          onPanelHeightChange={setPanelHeight}
          onHighlightChange={onHighlightChange}
          onDelete={onDeleteAttraction}
        />
      )}
    </div>
  );
}
