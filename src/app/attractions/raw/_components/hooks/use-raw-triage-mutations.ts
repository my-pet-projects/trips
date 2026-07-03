import { useCallback } from "react";
import { toast } from "sonner";

import { api } from "~/trpc/react";
import type { ExistingAttraction } from "~/types";

import { normalizeMapCoords } from "../coords";
import { getTriageErrorMessage } from "../errors";
import type { ApproveHighlight, StatusFilter, TriageMapQueryInput } from "../types";
import { toHighlightIconKey } from "../types";
import type { TriageCacheHelpers } from "./raw-triage-cache";
import type { SetTriageSelection } from "./use-raw-triage-selection";

export function useRawTriageMutations({
  queryInput,
  cache,
  setPromotion,
  clearPromotion,
  setSelection,
}: {
  queryInput: TriageMapQueryInput | null;
  cache: TriageCacheHelpers;
  setPromotion: (rawId: number, realId: number) => void;
  clearPromotion: (rawId: number) => void;
  setSelection: SetTriageSelection;
}) {
  function patchStatusCounts(from: StatusFilter, to: StatusFilter) {
    cache.patchCounts((prev) => ({
      ...prev,
      [from]: Math.max(0, prev[from] - 1),
      [to]: prev[to] + 1,
    }));
  }

  const approveMutation = api.rawAttraction.approve.useMutation({
    onMutate: async ({ id, highlight }) => {
      if (!queryInput) return;

      await cache.cancel();

      const previous = cache.getSnapshot();
      const raw = previous?.raw.find((r) => r.id === id);
      if (raw) {
        cache.patchRaw(id, { status: "approved" });
        if (raw.status === "pending") {
          cache.decrementPending();
        }

        if (raw.cityId) {
          const optimisticExisting: ExistingAttraction = {
            id: -id,
            name: raw.name,
            nameLocal: raw.nameLocal,
            description: raw.description,
            address: null,
            latitude: raw.latitude ?? 0,
            longitude: raw.longitude ?? 0,
            highlight: highlight ?? null,
            isPredefined: null,
            sourceUrl: raw.sourceUrl,
            cityId: raw.cityId,
            countryCode: raw.countryCode,
            createdAt: new Date(),
            updatedAt: null,
            isVerified: false,
          };

          cache.patchExisting((prev) => [...prev, optimisticExisting]);
          const highlightKey = toHighlightIconKey(highlight);
          cache.patchHighlightCounts((prev) => ({
            ...prev,
            [highlightKey]: prev[highlightKey] + 1,
          }));
          setSelection({
            kind: "existing",
            attraction: normalizeMapCoords(optimisticExisting),
          });
        }
      }

      return { previous };
    },
    onSuccess: ({ attraction }, { id, highlight }) => {
      setPromotion(id, attraction.id);
      cache.patchExisting((prev) => {
        const idx = prev.findIndex((a) => a.id === -id);
        if (idx === -1) return [...prev, attraction];
        const next = [...prev];
        next[idx] = attraction;
        return next;
      });
      setSelection((current) => {
        if (current?.kind === "raw" && current.attraction.id === id) {
          return { kind: "existing", attraction: normalizeMapCoords(attraction) };
        }
        if (current?.kind === "existing" && current.attraction.id === -id) {
          return { kind: "existing", attraction: normalizeMapCoords(attraction) };
        }
        return current;
      });
      toast.success(
        highlight === "must_see"
          ? "Promoted as must see"
          : highlight === "recommended"
            ? "Promoted as recommended"
            : "Attraction promoted",
      );
    },
    onError: (err, { id }, context) => {
      clearPromotion(id);
      cache.restore(context?.previous);
      toast.error(getTriageErrorMessage(err));
    },
  });

  const rejectMutation = api.rawAttraction.reject.useMutation({
    onMutate: async ({ id }) => {
      if (!queryInput) return;

      await cache.cancel();
      setSelection((current) =>
        current?.kind === "raw" && current.attraction.id === id ? null : current,
      );

      const previous = cache.getSnapshot();
      const raw = previous?.raw.find((r) => r.id === id);
      cache.patchRaw(id, { status: "rejected" });
      if (raw?.status === "pending") patchStatusCounts("pending", "rejected");
      return { previous };
    },
    onSuccess: () => {
      toast.success("Rejected");
    },
    onError: (err, _vars, context) => {
      cache.restore(context?.previous);
      toast.error(getTriageErrorMessage(err));
    },
  });

  const duplicatedMutation = api.rawAttraction.markDuplicated.useMutation({
    onMutate: async ({ id }) => {
      if (!queryInput) return;

      await cache.cancel();
      setSelection((current) =>
        current?.kind === "raw" && current.attraction.id === id ? null : current,
      );

      const previous = cache.getSnapshot();
      const raw = previous?.raw.find((r) => r.id === id);
      cache.patchRaw(id, { status: "duplicated" });
      if (raw?.status === "pending") patchStatusCounts("pending", "duplicated");
      return { previous };
    },
    onSuccess: () => {
      toast.success("Marked as duplicated");
    },
    onError: (err, _vars, context) => {
      cache.restore(context?.previous);
      toast.error(getTriageErrorMessage(err));
    },
  });

  const onApprove = useCallback(
    (id: number, highlight?: ApproveHighlight) =>
      approveMutation.mutate({ id, highlight }),
    [approveMutation],
  );
  const onReject = useCallback(
    (id: number) => rejectMutation.mutate({ id }),
    [rejectMutation],
  );
  const onDuplicated = useCallback(
    (id: number) => duplicatedMutation.mutate({ id }),
    [duplicatedMutation],
  );

  return {
    onApprove,
    onReject,
    onDuplicated,
    isMutating:
      approveMutation.isPending ||
      rejectMutation.isPending ||
      duplicatedMutation.isPending,
  };
}
