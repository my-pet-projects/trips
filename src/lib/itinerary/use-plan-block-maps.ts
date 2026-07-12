import { useMemo } from "react";

import { getPlanBlockColor } from "~/lib/map/colors";
import type { PlanBlock } from "~/types";

export function usePlanBlockMaps(planBlocks: PlanBlock[]) {
  const blockColors = useMemo(() => {
    const map = new Map<number, string>();
    planBlocks.forEach((block, index) =>
      map.set(block.id, getPlanBlockColor(index)),
    );
    return map;
  }, [planBlocks]);

  const attractionToBlockMap = useMemo(() => {
    const map = new Map<number, PlanBlock>();
    planBlocks.forEach((block) => {
      block.attractions.forEach((attraction) => map.set(attraction.id, block));
    });
    return map;
  }, [planBlocks]);

  return { blockColors, attractionToBlockMap };
}
