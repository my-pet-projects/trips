"use client";

import { useCallback } from "react";

import { api } from "~/trpc/react";

/** Routes are derived server-side from the stored trip, so both caches must refresh together. */
export function useInvalidateItinerary() {
  const utils = api.useUtils();

  return useCallback(() => {
    void utils.trip.invalidate();
    void utils.route.invalidate();
  }, [utils]);
}
