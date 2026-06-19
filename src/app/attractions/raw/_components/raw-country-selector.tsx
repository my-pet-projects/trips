"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { CountryCombobox } from "~/app/_components/geo/country-combobox";
import { api } from "~/trpc/react";
import type { Country } from "~/types";

interface RawCountrySelectorProps {
  selected?: string;
  compact?: boolean;
}

export function RawCountrySelector({ selected, compact }: RawCountrySelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: countries = [], isLoading, isError } = api.geo.getCountries.useQuery();

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
      placeholder="Select country…"
    />
  );
}
