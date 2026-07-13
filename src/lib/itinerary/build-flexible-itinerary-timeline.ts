export type TimelinePlanBlockLike = {
  id: number;
  blockNumber: number;
  pinnedStartDate: Date | null;
  pinnedEndDate: Date | null;
};

export type TimelineOvernightStopLike = {
  id: number;
  name: string;
  checkInDate: Date;
  checkOutDate: Date;
};

export type DatedPlanTimelineEntry<TBlock extends TimelinePlanBlockLike> = {
  type: "plan";
  block: TBlock;
  startDate: Date;
  endDate: Date;
};

export type StayTimelineEntry<TStop extends TimelineOvernightStopLike> = {
  type: "stay";
  stop: TStop;
  startDate: Date;
  endDate: Date;
};

export type FlexibleItineraryTimeline<
  TBlock extends TimelinePlanBlockLike,
  TStop extends TimelineOvernightStopLike,
> = {
  entries: Array<DatedPlanTimelineEntry<TBlock> | StayTimelineEntry<TStop>>;
  undatedBlocks: TBlock[];
};

export function buildFlexibleItineraryTimeline<
  TBlock extends TimelinePlanBlockLike,
  TStop extends TimelineOvernightStopLike,
>(
  blocks: readonly TBlock[],
  overnightStops: readonly TStop[],
): FlexibleItineraryTimeline<TBlock, TStop> {
  const datedBlocks: Array<DatedPlanTimelineEntry<TBlock>> = [];
  const undatedBlocks: TBlock[] = [];

  for (const block of blocks) {
    if (!block.pinnedStartDate) {
      undatedBlocks.push(block);
      continue;
    }

    datedBlocks.push({
      type: "plan",
      block,
      startDate: block.pinnedStartDate,
      endDate: block.pinnedEndDate ?? block.pinnedStartDate,
    });
  }

  undatedBlocks.sort((a, b) => a.blockNumber - b.blockNumber);

  const stayEntries: Array<StayTimelineEntry<TStop>> = overnightStops.map(
    (stop) => ({
      type: "stay",
      stop,
      startDate: stop.checkInDate,
      endDate: stop.checkOutDate,
    }),
  );

  const entries = [...datedBlocks, ...stayEntries].sort((a, b) => {
    const startDifference = a.startDate.getTime() - b.startDate.getTime();
    if (startDifference !== 0) return startDifference;
    // On a check-in date, single-day plans come before the stay while
    // multi-day plans come after it.
    if (a.type !== b.type) {
      const planEntry = a.type === "plan" ? a : b;
      const planComesFirst =
        planEntry.startDate.getTime() === planEntry.endDate.getTime();
      if (planComesFirst) return a.type === "plan" ? -1 : 1;
      return a.type === "stay" ? -1 : 1;
    }
    if (a.type === "plan" && b.type === "plan") {
      return (
        a.endDate.getTime() - b.endDate.getTime() ||
        a.block.blockNumber - b.block.blockNumber
      );
    }
    if (a.type === "stay" && b.type === "stay") {
      return a.stop.id - b.stop.id;
    }
    return 0;
  });

  return { entries, undatedBlocks };
}
