import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";

import {
  notifyMapExtensionSelection,
} from "~/lib/map/map-extension-bridge";

import type {
  ExistingMapAttraction,
  RawMapAttraction,
  TriageSelection,
} from "../types";

export function useRawTriageSelection(
  countryCode: string | undefined,
  rawAttractions: RawMapAttraction[],
  existing: ExistingMapAttraction[],
  resolveExistingId: (id: number) => number,
) {
  const [selection, setSelection] = useState<TriageSelection | null>(null);

  useEffect(() => {
    setSelection(null);
  }, [countryCode]);

  useEffect(() => {
    setSelection((current) => {
      if (!current) return null;
      if (current.kind === "raw") {
        const match = rawAttractions.find((r) => r.id === current.attraction.id);
        if (!match || match.status !== "pending") return null;
        return { kind: "raw", attraction: match };
      }
      const resolvedId = resolveExistingId(current.attraction.id);
      const match =
        existing.find((a) => a.id === resolvedId) ??
        existing.find((a) => a.id === current.attraction.id);
      return match ? { kind: "existing", attraction: match } : null;
    });
  }, [rawAttractions, existing, resolveExistingId]);

  const selectRaw = useCallback((attraction: RawMapAttraction) => {
    notifyMapExtensionSelection("raw", {
      ...attraction,
      city: attraction.cityName,
    });
    setSelection({ kind: "raw", attraction });
  }, []);

  const selectExisting = useCallback((attraction: ExistingMapAttraction) => {
    notifyMapExtensionSelection("raw", attraction);
    setSelection({ kind: "existing", attraction });
  }, []);

  const clearSelection = useCallback(() => setSelection(null), []);

  return {
    selection,
    setSelection,
    selectRaw,
    selectExisting,
    clearSelection,
  };
}

export type TriageSelectionState = ReturnType<typeof useRawTriageSelection>;
export type SetTriageSelection = Dispatch<SetStateAction<TriageSelection | null>>;
