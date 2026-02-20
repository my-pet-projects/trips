"use client";

import { useCallback, useState } from "react";

import { ItineraryMap } from "~/app/_components/map/itinerary-map";
import type { RouterOutputs } from "~/trpc/react";

type Attraction = RouterOutputs["attraction"]["getAllAttractions"][number];

type AttractionsViewerProps = {
  attractions: Attraction[];
};

export const AttractionsViewer = ({ attractions }: AttractionsViewerProps) => {
  const [selectedAttractionId, setSelectedAttractionId] = useState<
    number | null
  >(null);

  const handleAttractionSelect = useCallback((id: number | null) => {
    setSelectedAttractionId(id);
  }, []);

  return (
    <div className="h-[calc(100vh-12rem)]">
      <ItineraryMap
        attractions={attractions}
        selectedDayAttractions={[]}
        selectedDayId={null}
        selectedAttractionId={selectedAttractionId}
        hoveredAttractionId={null}
        viewMode="viewer"
        isLoadingRoutes={false}
        enableClustering={true}
        allDaysAttractions={new Map()}
        dayColors={new Map()}
        dayRoutes={new Map()}
        onAttractionSelect={handleAttractionSelect}
        onAddAttractionToDay={() => {}}
      />
    </div>
  );
};
