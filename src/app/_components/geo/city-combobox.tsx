"use client";

import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";

import { api, type RouterOutputs } from "~/trpc/react";

type City = RouterOutputs["geo"]["getCitiesByCountry"][number];

interface CitySelectOption {
  value: number;
  label: string;
  fullCity: City;
}

interface CityComboboxProps {
  countryCode: string | null;
  value: City | null;
  onChange: (city: City | null) => void;
  id?: string;
  label?: string;
  placeholder?: string;
  isClearable?: boolean;
  isDisabled?: boolean;
}

export const CityCombobox: React.FC<CityComboboxProps> = ({
  countryCode,
  value,
  onChange,
  id = "city-select",
  label = "City",
  placeholder = "Select a city...",
  isClearable = true,
  isDisabled = false,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(inputValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const {
    data: cities,
    isLoading: isLoadingCities,
    error,
  } = api.geo.getCitiesByCountry.useQuery(
    {
      countryCode: countryCode ?? "",
      search: debouncedSearch,
    },
    {
      enabled: !!countryCode, // Only fetch cities if a countryCode is provided
      staleTime: 1000 * 60 * 10,
    },
  );

  const options: CitySelectOption[] = useMemo(() => {
    return (
      cities?.map((c) => ({
        value: c.id,
        label: c.name,
        fullCity: c,
      })) ?? []
    );
  }, [cities]);

  const selectedOption = useMemo(() => {
    if (!value) return null;
    return options.find((option) => option.value === value.id) ?? null;
  }, [value, options]);

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-white">
        {label}
      </label>
      <Select<CitySelectOption>
        instanceId={id}
        id={id}
        options={options}
        isLoading={isLoadingCities}
        value={selectedOption}
        onChange={(option: CitySelectOption | null) =>
          onChange(option ? option.fullCity : null)
        }
        onInputChange={(newValue: string) => setInputValue(newValue)}
        isClearable={isClearable}
        isDisabled={isDisabled || !countryCode || !!error}
        placeholder={
          error
            ? "Error loading cities"
            : !countryCode
              ? "Select a country first"
              : placeholder
        }
        aria-label={label}
        noOptionsMessage={() =>
          countryCode ? "No cities found" : "Select a country first"
        }
        className="basic-single"
        classNamePrefix="select"
      />
      {error && countryCode && (
        <p className="mt-1 text-sm text-red-400">
          Failed to load cities. Please try again.
        </p>
      )}
    </div>
  );
};
