import { useCallback } from "react";

import {
  notifyTripsImageExtension,
  type TripsImageSource,
} from "~/lib/trips-image-extension";
import type { AttractionSummary } from "~/types";

/**
 * Marker click handler shared by the browse and itinerary maps: notify the
 * Trips image extension about the attraction, then select it.
 */
export function useMarkerSelect(
  source: TripsImageSource,
  onSelect: (attractionId: number) => void,
) {
  return useCallback(
    (attraction: AttractionSummary) => {
      notifyTripsImageExtension(source, attraction);
      onSelect(attraction.id);
    },
    [source, onSelect],
  );
}
