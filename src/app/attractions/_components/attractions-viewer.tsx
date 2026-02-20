"use client";

import { useCallback, useState } from "react";

import { ItineraryMap } from "~/app/_components/map/itinerary-map";
import type { RouterOutputs } from "~/trpc/react";

type Attraction = RouterOutputs["attraction"]["getAllAttractions"][number];

type AttractionsViewerProps = {
  attractions: Attraction[];
};

// Empty maps and arrays - we don't need itinerary features for this view
const EMPTY_MAP = new Map();
const EMPTY_ARRAY: never[] = [];

export const AttractionsViewer = ({ attractions }: AttractionsViewerProps) => {
  const [selectedAttractionId, setSelectedAttractionId] = useState<
    number | null
  >(null);

  const handleAttractionSelect = useCallback((id: number | null) => {
    setSelectedAttractionId(id);
  }, []);

  // No-op for add to day - not needed in this view
  const handleAddToDay = useCallback(() => {}, []);

  return (
    <div className="h-[calc(100vh-12rem)]">
      <ItineraryMap
        attractions={attractions}
        selectedDayAttractions={EMPTY_ARRAY}
        selectedDayId={null}
        selectedAttractionId={selectedAttractionId}
        hoveredAttractionId={null}
        viewMode="viewer"
        isLoadingRoutes={false}
        enableClustering={true}
        allDaysAttractions={EMPTY_MAP}
        dayColors={EMPTY_MAP}
        dayRoutes={EMPTY_MAP}
        onAttractionSelect={handleAttractionSelect}
        onAddAttractionToDay={handleAddToDay}
      />
    </div>
  );
};
