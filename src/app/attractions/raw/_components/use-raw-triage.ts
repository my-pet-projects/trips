import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { api } from "~/trpc/react";
import type { HighlightIconKey } from "./map-icons";

export type StatusFilter = "pending" | "rejected" | "duplicated";
type RawStatus = StatusFilter | "approved";

export const FILTERS: { key: StatusFilter; label: string; color: string }[] = [
  { key: "pending", label: "Pending", color: "bg-amber-400" },
  { key: "rejected", label: "Rejected", color: "bg-red-500" },
  { key: "duplicated", label: "Duplicated", color: "bg-purple-500" },
];

export const HIGHLIGHT_FILTERS: { key: HighlightIconKey; label: string; color: string }[] = [
  { key: "must_see",    label: "Must see",    color: "bg-cyan-500" },
  { key: "recommended", label: "Recommended", color: "bg-emerald-500" },
  { key: "skip",        label: "Skip",        color: "bg-rose-400" },
  { key: "none",        label: "Regular",     color: "bg-slate-400" },
];

export function useRawTriage(countryCode: string | undefined) {
  const [visibleStatuses, setVisibleStatuses] = useState<Set<StatusFilter>>(
    new Set(["pending"]),
  );
  const [visibleHighlights, setVisibleHighlights] = useState<Set<HighlightIconKey>>(
    new Set(["must_see", "recommended", "skip", "none"]),
  );
  const [locallyRemovedIds, setLocallyRemovedIds] = useState<Set<number>>(
    new Set(),
  );

  const utils = api.useUtils();

  const {
    data: rawAttractions = [],
    refetch: refetchRaw,
    isLoading: isLoadingRaw,
  } = api.rawAttraction.getByCountry.useQuery(
    { countryCode: countryCode! },
    { enabled: !!countryCode },
  );
  const { data: existing = [], isLoading: isLoadingExisting } =
    api.rawAttraction.getExistingByCountry.useQuery(
      { countryCode: countryCode! },
      { enabled: !!countryCode },
    );

  function removeLocally(id: number) {
    setLocallyRemovedIds((prev) => new Set(prev).add(id));
  }

  function patchRawCache(id: number, status: RawStatus) {
    utils.rawAttraction.getByCountry.setData(
      { countryCode: countryCode! },
      (prev) =>
        prev ? prev.map((r) => (r.id === id ? { ...r, status } : r)) : prev,
    );
  }

  const approveMutation = api.rawAttraction.approve.useMutation({
    onMutate: ({ id }) => removeLocally(id),
    onSuccess: () => {
      void refetchRaw();
      void utils.rawAttraction.getExistingByCountry.invalidate({
        countryCode: countryCode!,
      });
      toast.success("Attraction promoted");
    },
    onError: (err) => toast.error(err.message),
  });

  const rejectMutation = api.rawAttraction.reject.useMutation({
    onMutate: ({ id }) => patchRawCache(id, "rejected"),
    onSuccess: () => {
      void refetchRaw();
      toast.success("Rejected");
    },
    onError: (err) => toast.error(err.message),
  });

  const duplicatedMutation = api.rawAttraction.markDuplicated.useMutation({
    onMutate: ({ id }) => patchRawCache(id, "duplicated"),
    onSuccess: () => {
      void refetchRaw();
      toast.success("Marked as duplicated");
    },
    onError: (err) => toast.error(err.message),
  });

  const visibleRaw = useMemo(
    () => rawAttractions.filter((r) => !locallyRemovedIds.has(r.id)),
    [rawAttractions, locallyRemovedIds],
  );

  const allPoints = useMemo<[number, number][]>(
    () => [
      ...rawAttractions.flatMap((r) =>
        r.latitude != null && r.longitude != null
          ? [[r.latitude, r.longitude] as [number, number]]
          : [],
      ),
      ...existing.flatMap((e) =>
        e.latitude != null && e.longitude != null
          ? [[e.latitude, e.longitude] as [number, number]]
          : [],
      ),
    ],
    [rawAttractions, existing],
  );

  const counts = useMemo(() => {
    const c = { pending: 0, rejected: 0, duplicated: 0 };
    for (const r of rawAttractions) {
      if (r.status === "pending") c.pending++;
      else if (r.status === "rejected") c.rejected++;
      else if (r.status === "duplicated") c.duplicated++;
    }
    return c;
  }, [rawAttractions]);

  const highlightCounts = useMemo(() => {
    const c: Record<HighlightIconKey, number> = { must_see: 0, recommended: 0, skip: 0, none: 0 };
    for (const a of existing) {
      const key = (a.highlight as HighlightIconKey | null) ?? "none";
      c[key]++;
    }
    return c;
  }, [existing]);

  function toggleStatus(s: StatusFilter) {
    setVisibleStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  function toggleHighlight(h: HighlightIconKey) {
    setVisibleHighlights((prev) => {
      const next = new Set(prev);
      if (next.has(h)) next.delete(h);
      else next.add(h);
      return next;
    });
  }

  const onApprove = useCallback(
    (id: number) => approveMutation.mutate({ id }),
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
    rawAttractions: visibleRaw,
    existing,
    isLoading: isLoadingRaw || isLoadingExisting,
    visibleStatuses,
    toggleStatus,
    counts,
    visibleHighlights,
    toggleHighlight,
    highlightCounts,
    allPoints,
    isMutating:
      approveMutation.isPending ||
      rejectMutation.isPending ||
      duplicatedMutation.isPending,
    onApprove,
    onReject,
    onDuplicated,
  };
}
