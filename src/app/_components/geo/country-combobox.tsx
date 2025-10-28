"use client";

import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";

import { api, type RouterOutputs } from "~/trpc/react";

type Country = RouterOutputs["geo"]["getCountries"][number];

interface CountrySelectOption {
  value: string;
  label: string;
  fullCountry: Country;
}

interface CountryComboboxProps {
  value: Country | null;
  onChange: (country: Country | null) => void;
  initialValue?: string; // NEW: cca2, cca3, or name to resolve
  id?: string;
  label?: string;
  placeholder?: string;
  isClearable?: boolean;
  isDisabled?: boolean;
}

export const CountryCombobox: React.FC<CountryComboboxProps> = ({
  value,
  onChange,
  initialValue,
  id = "country-select",
  label = "Country",
  placeholder = "Select a country...",
  isClearable = true,
  isDisabled = false,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const inputId = `${id}-input`;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(inputValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const {
    data: countries,
    isLoading: isLoadingCountries,
    error,
  } = api.geo.getCountries.useQuery(
    { search: debouncedSearch.trim() || undefined },
    {
      staleTime: 1000 * 60 * 60,
    },
  );

  const options: CountrySelectOption[] = useMemo(() => {
    return (
      countries?.map((c) => ({
        value: c.cca2,
        label: c.name,
        fullCountry: c,
      })) ?? []
    );
  }, [countries]);

  useEffect(() => {
    console.log("CountryCombobox: initialValue =", initialValue);
    if (initialValue && countries && !value && !isInitialized) {
      const country = countries.find((c) => c.cca2 === initialValue);
      if (country) {
        onChange(country);
      }
      setIsInitialized(true);
    } else if (!initialValue && !isInitialized) {
      setIsInitialized(true);
    }
  }, [initialValue, countries, value, onChange, isInitialized]);

  const selectedOption = useMemo(() => {
    if (!value) return null;
    return options.find((option) => option.value === value.cca2) ?? null;
  }, [value, options]);

  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-1 block text-sm font-medium text-white"
      >
        {label}
      </label>
      <Select<CountrySelectOption>
        instanceId={id}
        id={id}
        inputId={inputId}
        options={options}
        isLoading={isLoadingCountries}
        loadingMessage={() => "Loading countries..."}
        value={selectedOption}
        onChange={(option: CountrySelectOption | null) =>
          onChange(option ? option.fullCountry : null)
        }
        onInputChange={(newValue: string, { action }) => {
          if (action === "input-change") setInputValue(newValue);
        }}
        isClearable={isClearable}
        isDisabled={isDisabled || !!error}
        placeholder={error ? "Error loading countries" : placeholder}
        noOptionsMessage={() => "No countries found"}
        filterOption={null}
        className="basic-single"
        classNamePrefix="select"
      />
      {error && (
        <p className="mt-1 text-sm text-red-400">
          Failed to load countries. Please try again.
        </p>
      )}
    </div>
  );
};
