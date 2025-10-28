"use client";

import { useState } from "react";
import type { RouterOutputs } from "~/trpc/react";
import { CityCombobox } from "./city-combobox";
import { CountryCombobox } from "./country-combobox";

type Country = RouterOutputs["geo"]["getCountries"][number];
type City = RouterOutputs["geo"]["getCitiesByCountry"][number];

type CountryCitySelectorProps = {
  initialCountryCode?: string;
  initialCityId?: number;
  onChange?: (countryCode: string, cityId: number | null) => void;
};

export function CountryCitySelector({
  initialCountryCode = "",
  initialCityId,
  onChange,
}: CountryCitySelectorProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const handleCountryChange = (country: Country | null) => {
    setSelectedCountry(country);
    setSelectedCity(null);
  };

  const handleCityChange = (city: City | null) => {
    setSelectedCity(city);
    onChange?.(selectedCountry?.cca2 ?? "", city?.id ?? null);
  };

  return (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-2">
      <CountryCombobox
        value={selectedCountry}
        onChange={handleCountryChange}
        initialValue={initialCountryCode}
      />

      <CityCombobox
        value={selectedCity}
        onChange={handleCityChange}
        initialValue={initialCityId}
        countryCode={selectedCountry?.cca2 ?? null}
        isDisabled={!selectedCountry}
      />
    </div>
  );
}
