"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api, type RouterOutputs } from "~/trpc/react";
import { CityCombobox } from "./city-combobox";
import { CountryCombobox } from "./country-combobox";

type Country = RouterOutputs["geo"]["getCountries"][number];
type City = RouterOutputs["geo"]["getCitiesByCountry"][number];

type CountryCitySelectorProps = {
  initialCountry?: string;
  initialCity?: string;
  onChange?: (country: string | null, city: string | null) => void;
};

export function CountryCitySelector({
  initialCountry,
  initialCity,
  onChange,
}: CountryCitySelectorProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [citySearchQuery, setCitySearchQuery] = useState("");

  // Track initialization: 'pending' | 'loading-city' | 'complete'
  const initStatus = useRef<"pending" | "loading-city" | "complete">("pending");

  const {
    data: countries,
    isLoading: isLoadingCountries,
    error: countriesError,
  } = api.geo.getCountries.useQuery();

  const shouldFetchCities =
    !!selectedCountry?.cca2 && (!selectedCity || !!citySearchQuery);

  const {
    data: cities,
    isLoading: isLoadingCities,
    error: citiesError,
  } = api.geo.getCitiesByCountry.useQuery(
    {
      countryCode: selectedCountry?.cca2 ?? "",
      search: citySearchQuery || undefined,
    },
    {
      enabled: shouldFetchCities,
    },
  );

  const countryOptions = useMemo(
    () =>
      countries?.map((c) => ({
        value: c.cca2,
        label: c.name,
        fullCountry: c,
      })) ?? [],
    [countries],
  );

  const cityOptions = useMemo(() => {
    const options =
      cities?.map((c) => ({
        value: c.id,
        label: c.name,
        fullCity: c,
      })) ?? [];

    if (selectedCity && !options.some((o) => o.value === selectedCity.id)) {
      options.unshift({
        value: selectedCity.id,
        label: selectedCity.name,
        fullCity: selectedCity,
      });
    }

    return options;
  }, [cities, selectedCity]);

  // One-time initialization
  useEffect(() => {
    if (initStatus.current !== "pending" || !countries) return;

    const country = countries.find((c) => c.cca2 === initialCountry);
    if (country) {
      setSelectedCountry(country);
      if (initialCity) {
        initStatus.current = "loading-city";
        setCitySearchQuery(initialCity);
      } else {
        initStatus.current = "complete";
      }
    } else {
      initStatus.current = "complete";
    }
  }, [countries, initialCountry, initialCity]);

  // Set city when found in results (only during initialization)
  useEffect(() => {
    if (initStatus.current !== "loading-city" || !cities || selectedCity)
      return;

    const city = cities.find((c) => c.name === initialCity);
    if (city) {
      setSelectedCity(city);
    }
    initStatus.current = "complete";
  }, [cities, initialCity, selectedCity]);

  // Notify parent of changes after initialization
  useEffect(() => {
    if (initStatus.current !== "complete") return;

    onChange?.(selectedCountry?.cca2 ?? null, selectedCity?.name ?? null);
  }, [selectedCountry, selectedCity, onChange]);

  return (
    <div className="flex w-full flex-col gap-6 sm:flex-row sm:gap-4 md:gap-6">
      <div className="flex-1">
        <CountryCombobox
          value={selectedCountry}
          onChange={(country) => {
            setSelectedCountry(country);
            setSelectedCity(null);
            setCitySearchQuery("");
          }}
          options={countryOptions}
          isLoading={isLoadingCountries}
          error={!!countriesError}
        />
      </div>
      <div className="flex-1">
        <CityCombobox
          value={selectedCity}
          onChange={setSelectedCity}
          onDebouncedSearchTermChange={setCitySearchQuery}
          countryCode={selectedCountry?.cca2 ?? null}
          options={cityOptions}
          isLoading={isLoadingCities}
          error={!!citiesError}
          isDisabled={!selectedCountry}
        />
      </div>
    </div>
  );
}
