import { expect, test } from "@playwright/test";

import { buildFlexibleItineraryTimeline } from "../src/lib/itinerary/build-flexible-itinerary-timeline";

const date = (day: number) => new Date(Date.UTC(2026, 6, day));

const stays = [
  {
    id: 1,
    name: "Hotel Aurora",
    checkInDate: date(10),
    checkOutDate: date(13),
  },
  {
    id: 2,
    name: "Hotel Lake",
    checkInDate: date(15),
    checkOutDate: date(18),
  },
];

function block(
  id: number,
  startDay: number | null,
  endDay: number | null = startDay,
) {
  return {
    id,
    blockNumber: id,
    pinnedStartDate: startDay === null ? null : date(startDay),
    pinnedEndDate: endDay === null ? null : date(endDay),
  };
}

test.describe("flexible itinerary timeline model", () => {
  test("orders flexible ranges and overnight stays chronologically", () => {
    const timeline = buildFlexibleItineraryTimeline(
      [block(1, 8, 9), block(2, 10, 12), block(3, 13, 14), block(4, 18, 20)],
      stays,
    );

    expect(
      timeline.entries.map((entry) =>
        entry.type === "plan"
          ? `plan-${entry.block.id}`
          : `stay-${entry.stop.id}`,
      ),
    ).toEqual(["plan-1", "stay-1", "plan-2", "plan-3", "stay-2", "plan-4"]);
  });

  test("does not duplicate blocks spanning multiple stays", () => {
    const timeline = buildFlexibleItineraryTimeline([block(1, 11, 16)], stays);
    const planEntries = timeline.entries.filter(
      (entry) => entry.type === "plan",
    );

    expect(planEntries).toHaveLength(1);
  });

  test("places a same-day plan before its check-in anchor", () => {
    const sameDayStay = {
      id: 3,
      name: "Hotel Forest",
      checkInDate: date(26),
      checkOutDate: date(31),
    };
    const timeline = buildFlexibleItineraryTimeline(
      [block(1, 26, 30), block(2, 26, 26)],
      [sameDayStay],
    );

    expect(
      timeline.entries.map((entry) =>
        entry.type === "plan"
          ? `plan-${entry.block.id}`
          : `stay-${entry.stop.id}`,
      ),
    ).toEqual(["plan-2", "stay-3", "plan-1"]);
  });

  test("keeps undated and equal-date blocks in manual order", () => {
    const timeline = buildFlexibleItineraryTimeline(
      [
        { ...block(3, null), blockNumber: 2 },
        { ...block(1, 10), blockNumber: 2 },
        { ...block(2, 10), blockNumber: 1 },
        { ...block(4, null), blockNumber: 1 },
      ],
      [],
    );

    expect(
      timeline.entries
        .filter((entry) => entry.type === "plan")
        .map((entry) => entry.block.id),
    ).toEqual([2, 1]);
    expect(timeline.undatedBlocks.map((item) => item.id)).toEqual([4, 3]);
  });

  test("treats a null end date as a single-day plan", () => {
    const timeline = buildFlexibleItineraryTimeline(
      [block(1, 10, null)],
      [stays[0]!],
    );

    expect(
      timeline.entries.map((entry) =>
        entry.type === "plan"
          ? `plan-${entry.block.id}`
          : `stay-${entry.stop.id}`,
      ),
    ).toEqual(["plan-1", "stay-1"]);
  });
});
