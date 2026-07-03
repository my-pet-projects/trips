import type { ExistingAttraction, RawAttraction } from "~/types";

import type { HighlightCounts, StatusCounts, TriageMapQueryInput } from "../types";

export type TriageMapData = {
  raw: RawAttraction[];
  existing: ExistingAttraction[];
  counts: StatusCounts;
  highlightCounts: HighlightCounts;
};

type TriageUtils = ReturnType<typeof import("~/trpc/react").api.useUtils>;

export function createTriageCacheHelpers(
  utils: TriageUtils,
  queryInput: TriageMapQueryInput | null,
) {
  function setData(
    updater: (prev: TriageMapData | undefined) => TriageMapData | undefined,
  ) {
    if (!queryInput) return;
    utils.rawAttraction.getTriageMapData.setData(queryInput, updater);
  }

  return {
    getSnapshot(): TriageMapData | undefined {
      if (!queryInput) return undefined;
      return utils.rawAttraction.getTriageMapData.getData(queryInput);
    },

    patchRaw(id: number, patch: Partial<RawAttraction>) {
      setData((prev) =>
        prev
          ? {
              ...prev,
              raw: prev.raw.map((r) => (r.id === id ? { ...r, ...patch } : r)),
            }
          : prev,
      );
    },

    patchExisting(updater: (existing: ExistingAttraction[]) => ExistingAttraction[]) {
      setData((prev) =>
        prev ? { ...prev, existing: updater(prev.existing) } : prev,
      );
    },

    patchCounts(updater: (counts: StatusCounts) => StatusCounts) {
      setData((prev) =>
        prev ? { ...prev, counts: updater(prev.counts) } : prev,
      );
    },

    patchHighlightCounts(updater: (counts: HighlightCounts) => HighlightCounts) {
      setData((prev) =>
        prev ? { ...prev, highlightCounts: updater(prev.highlightCounts) } : prev,
      );
    },

    decrementPending() {
      setData((prev) =>
        prev
          ? {
              ...prev,
              counts: {
                ...prev.counts,
                pending: Math.max(0, prev.counts.pending - 1),
              },
            }
          : prev,
      );
    },

    async cancel() {
      if (!queryInput) return;
      await utils.rawAttraction.getTriageMapData.cancel(queryInput);
    },

    restore(data: TriageMapData | undefined) {
      if (!queryInput || !data) return;
      utils.rawAttraction.getTriageMapData.setData(queryInput, data);
    },
  };
}

export type TriageCacheHelpers = ReturnType<typeof createTriageCacheHelpers>;
