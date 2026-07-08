import { useMemo } from "react";

import type { AttractionDetail, BasicAttraction } from "~/types";

import type { AttractionMapStatus } from "./attraction-map-shell";

export function usePlanBlockMapDerivedState(
  allBlocksAttractions: Map<number, BasicAttraction[]>,
  selectedBlockAttractions: BasicAttraction[],
  selectedBlockId: number | null,
) {
  const attractionToBlockMap = useMemo(() => {
    const map = new Map<number, number>();
    allBlocksAttractions.forEach((blockAttractions, blockId) => {
      blockAttractions.forEach((attraction) => {
        map.set(attraction.id, blockId);
      });
    });
    return map;
  }, [allBlocksAttractions]);

  const selectedBlockAttractionOrders = useMemo(() => {
    const map = new Map<number, number>();
    selectedBlockAttractions.forEach((attr, index) => {
      map.set(attr.id, index + 1);
    });
    return map;
  }, [selectedBlockAttractions]);

  const resolveAttractionStatus = useMemo(
    (): ((attraction: AttractionDetail) => AttractionMapStatus) =>
      (attraction) => {
        const blockId = attractionToBlockMap.get(attraction.id);
        return {
          blockId,
          isInAnyBlock: blockId !== undefined,
          isInSelectedBlock: blockId === selectedBlockId,
        };
      },
    [attractionToBlockMap, selectedBlockId],
  );

  return {
    attractionToBlockMap,
    selectedBlockAttractionOrders,
    resolveAttractionStatus,
  };
}
