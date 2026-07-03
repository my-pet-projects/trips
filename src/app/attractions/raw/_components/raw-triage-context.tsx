"use client";

import { createContext, useContext, type ReactNode } from "react";

import { useRawTriage } from "./hooks/use-raw-triage";

type RawTriageContextValue = ReturnType<typeof useRawTriage>;

const RawTriageContext = createContext<RawTriageContextValue | null>(null);

export function RawTriageProvider({
  countryCode,
  children,
}: {
  countryCode?: string;
  children: ReactNode;
}) {
  const value = useRawTriage(countryCode);
  return (
    <RawTriageContext.Provider value={value}>{children}</RawTriageContext.Provider>
  );
}

export function useRawTriageContext() {
  const ctx = useContext(RawTriageContext);
  if (!ctx) {
    throw new Error("useRawTriageContext must be used within RawTriageProvider");
  }
  return ctx;
}
