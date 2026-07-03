"use client";

import { createContext, useContext, type ReactNode } from "react";

import { useBrowseMap } from "./hooks/use-browse-map";

type BrowseMapContextValue = ReturnType<typeof useBrowseMap>;

const BrowseMapContext = createContext<BrowseMapContextValue | null>(null);

export function BrowseMapProvider({ children }: { children: ReactNode }) {
  const value = useBrowseMap();
  return <BrowseMapContext.Provider value={value}>{children}</BrowseMapContext.Provider>;
}

export function useBrowseMapContext() {
  const ctx = useContext(BrowseMapContext);
  if (!ctx) {
    throw new Error("useBrowseMapContext must be used within BrowseMapProvider");
  }
  return ctx;
}
