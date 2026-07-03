import { useSetToggleFilter } from "~/lib/map/use-set-toggle-filter";

import type { HighlightIconKey, StatusFilter } from "../types";

export function useRawTriageFilters() {
  const { visible: visibleStatuses, toggle: toggleStatus } = useSetToggleFilter<StatusFilter>([
    "pending",
  ]);
  const { visible: visibleHighlights, toggle: toggleHighlight } =
    useSetToggleFilter<HighlightIconKey>(["must_see", "recommended", "skip", "none"]);

  return {
    visibleStatuses,
    visibleHighlights,
    toggleStatus,
    toggleHighlight,
  };
}
