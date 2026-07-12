import { useMemo } from "react";

import type { AttractionDetail, BasicAttraction, PlanBlock } from "~/types";

import type { AttractionMapStatus } from "./base-attraction-map";

export function usePlanBlockMapDerivedState(
  attractionToBlockMap: Map<number, PlanBlock>,
  selectedBlockAttractions: BasicAttraction[],
  selectedBlockId: number | null,
) {
  const attractionToBlockId = useMemo(() => {
    const map = new Map<number, number>();
    attractionToBlockMap.forEach((block, attractionId) => {
      map.set(attractionId, block.id);
    });
    return map;
  }, [attractionToBlockMap]);

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
        const blockId = attractionToBlockId.get(attraction.id);
        return {
          blockId,
          isInAnyBlock: blockId !== undefined,
          isInSelectedBlock: blockId === selectedBlockId,
        };
      },
    [attractionToBlockId, selectedBlockId],
  );

  return {
    attractionToBlockId,
    selectedBlockAttractionOrders,
    resolveAttractionStatus,
  };
}
