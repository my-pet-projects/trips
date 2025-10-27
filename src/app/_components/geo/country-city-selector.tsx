"use client";

import React, { useState } from "react";
import { CountryCombobox } from "~/app/_components/geo/country-combobox";

import { type RouterOutputs } from "~/trpc/react";
import { CityCombobox } from "./city-combobox";

type Country = RouterOutputs["geo"]["getCountries"][number];
type City = RouterOutputs["geo"]["getCitiesByCountry"][number];

export const CountryCitySelector: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const handleCountryChange = (country: Country | null) => {
    setSelectedCountry(country);
    setSelectedCity(null);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <CountryCombobox value={selectedCountry} onChange={handleCountryChange} />

      <CityCombobox
        countryCode={selectedCountry?.cca2 ?? null}
        value={selectedCity}
        onChange={setSelectedCity}
      />

      <div className="mt-4 rounded-md bg-gray-50 p-3">
        <h3 className="text-lg font-semibold">Selected:</h3>
        <p>Country CCA2: {selectedCountry?.cca2 ?? "None"}</p>
        <p>Country Name: {selectedCountry?.name ?? "None"}</p>
        <p>City ID: {selectedCity?.id ?? "None"}</p>
        <p>City Name: {selectedCity?.name ?? "None"}</p>
        {selectedCity?.country && (
          <p>
            City&apos;s Country (from City object): {selectedCity.country.name}
          </p>
        )}
      </div>
    </div>
  );
};
