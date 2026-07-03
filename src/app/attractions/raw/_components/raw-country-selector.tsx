"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { CountryCombobox } from "~/app/_components/geo/country-combobox";
import { api } from "~/trpc/react";
import type { Country } from "~/types";
import { getTriageErrorMessage } from "./errors";

let lastCountriesError: unknown = null;

interface RawCountrySelectorProps {
  selected?: string;
  compact?: boolean;
}

export function RawCountrySelector({ selected, compact }: RawCountrySelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    data: countries = [],
    isLoading,
    isError,
    error,
    refetch,
  } = api.geo.getCountries.useQuery(undefined, { retry: 1 });

  useEffect(() => {
    if (!isError || !error || error === lastCountriesError) return;
    lastCountriesError = error;
    toast.error(getTriageErrorMessage(error), {
      action: {
        label: "Retry",
        onClick: () => void refetch(),
      },
    });
  }, [isError, error, refetch]);

  const options = countries.map((c) => ({
    value: c.cca2,
    label: c.name,
    fullCountry: c,
  }));

  const selectedCountry = countries.find((c) => c.cca2 === selected) ?? null;

  function handleChange(country: Country | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (country) {
      params.set("country", country.cca2);
    } else {
      params.delete("country");
    }
    router.replace(`/attractions/raw?${params.toString()}`);
  }

  return (
    <CountryCombobox
      options={options}
      isLoading={isLoading}
      error={isError}
      showLabel={false}
      compact={compact}
      value={selectedCountry}
      onChange={handleChange}
      placeholder={isError ? "Failed to load countries" : "Select country…"}
    />
  );
}
