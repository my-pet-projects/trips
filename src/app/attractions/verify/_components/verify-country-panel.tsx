"use client";

import { useRouter } from "next/navigation";

import { CountryCombobox } from "~/app/_components/geo/country-combobox";
import type { Country } from "~/types";

type VerifyCountryPanelProps = {
  countries: Country[];
  selectedCountryCode?: string;
};

export function VerifyCountryPanel({
  countries,
  selectedCountryCode,
}: VerifyCountryPanelProps) {
  const router = useRouter();

  const options = countries.map((c) => ({
    value: c.cca2,
    label: c.name,
    fullCountry: c,
  }));

  const selectedCountry =
    countries.find((c) => c.cca2 === selectedCountryCode) ?? null;

  function handleChange(country: Country | null) {
    router.replace(
      country
        ? `/attractions/verify?country=${encodeURIComponent(country.cca2)}`
        : "/attractions/verify",
    );
  }

  return (
    <CountryCombobox
      options={options}
      isLoading={false}
      showLabel
      value={selectedCountry}
      onChange={handleChange}
      placeholder="Select country…"
    />
  );
}
