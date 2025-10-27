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
  id?: string;
  label?: string;
  placeholder?: string;
  isClearable?: boolean;
  isDisabled?: boolean;
}

export const CountryCombobox: React.FC<CountryComboboxProps> = ({
  value,
  onChange,
  id = "country-select",
  label = "Country",
  placeholder = "Select a country...",
  isClearable = true,
  isDisabled = false,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

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
    { search: debouncedSearch },
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

  const selectedOption = useMemo(() => {
    if (!value) return null;
    return options.find((option) => option.value === value.cca2) ?? null;
  }, [value, options]);

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-white">
        {label}
      </label>
      <Select<CountrySelectOption>
        instanceId={id}
        id={id}
        options={options}
        isLoading={isLoadingCountries}
        value={selectedOption}
        onChange={(option: CountrySelectOption | null) =>
          onChange(option ? option.fullCountry : null)
        }
        onInputChange={(newValue: string) => setInputValue(newValue)}
        isClearable={isClearable}
        isDisabled={isDisabled || !!error}
        placeholder={error ? "Error loading countries" : placeholder}
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
