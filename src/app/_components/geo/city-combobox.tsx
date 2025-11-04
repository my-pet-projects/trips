"use client";

import React, { useEffect, useRef } from "react";
import Select from "react-select";

import type { RouterOutputs } from "~/trpc/react";

type City = RouterOutputs["geo"]["getCitiesByCountry"][number];

export interface CitySelectOption {
  value: number;
  label: string;
  fullCity: City;
}

interface CityComboboxProps {
  options: CitySelectOption[];
  isLoading: boolean;
  value: City | null;
  onChange: (city: City | null) => void;
  onDebouncedSearchTermChange: (searchTerm: string) => void;
  isDisabled?: boolean;
  countryCode: string | null;
  error?: boolean;
}

export const CityCombobox: React.FC<CityComboboxProps> = ({
  options,
  isLoading,
  value,
  onChange,
  onDebouncedSearchTermChange,
  isDisabled = false,
  countryCode,
  error = false,
}) => {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleDebouncedSearch = (searchTerm: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (searchTerm !== (value?.name ?? "")) {
      debounceTimerRef.current = setTimeout(() => {
        onDebouncedSearchTermChange(searchTerm);
      }, 300);
    } else {
      onDebouncedSearchTermChange("");
    }
  };

  const selectedOption = value
    ? { value: value.id, label: value.name, fullCity: value }
    : null;

  return (
    <div className="w-full">
      <label
        htmlFor="city-select"
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        City
      </label>
      <Select<CitySelectOption>
        key={`city-select-${value?.id ?? "null"}`}
        instanceId="city-select"
        options={options}
        isLoading={isLoading}
        loadingMessage={() => "Loading cities..."}
        value={selectedOption}
        onInputChange={(newValue, { action }) => {
          if (action === "input-change") {
            handleDebouncedSearch(newValue);
          } else if (action === "menu-close" || action === "input-blur") {
            handleDebouncedSearch(value?.name ?? "");
          }
        }}
        onChange={(option) => {
          onChange(option?.fullCity ?? null);
          onDebouncedSearchTermChange("");
        }}
        isClearable
        isDisabled={isDisabled || !countryCode || error}
        placeholder={
          error
            ? "Error loading cities"
            : !countryCode
              ? "Select a country first"
              : "Select a city..."
        }
        noOptionsMessage={() =>
          countryCode ? "No cities found" : "Select a country first"
        }
        filterOption={null}
        classNames={{
          control: (state) =>
            `!w-full !rounded-lg !border ${
              state.isFocused
                ? "!border-orange-500 !ring-1 !ring-orange-500"
                : error
                  ? "!border-red-500"
                  : "!border-gray-300"
            } !bg-gray-50 !h-12 !text-base ${state.isDisabled ? "!bg-gray-200" : ""}`,
          placeholder: () => "!text-gray-400",
          singleValue: () => "!truncate",
          input: () => "",
          indicatorSeparator: () => "!bg-gray-300",
          dropdownIndicator: () => "!text-gray-400 hover:!text-gray-500",
          clearIndicator: () => "!text-gray-400 hover:!text-red-500",
          menu: () => "!rounded-lg !shadow-md !mt-2",
          option: (state) =>
            `!text-gray-800 ${state.isSelected ? "!bg-orange-200 !text-orange-700" : state.isFocused ? "!bg-orange-50" : "!bg-white"}`,
        }}
      />
      {error && countryCode && (
        <p className="mt-1 text-sm text-red-500">
          Failed to load cities. Please try again.
        </p>
      )}
    </div>
  );
};
