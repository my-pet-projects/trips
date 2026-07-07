"use client";

import React, { useEffect, useMemo, useRef } from "react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxStatus,
} from "~/app/_components/ui/combobox";
import { Label } from "~/app/_components/ui/label";
import type { City } from "~/types";

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
  showLabel?: boolean;
}

const cityLabel = (city: City) => city.name;
const cityEquals = (a: City, b: City) => a.id === b.id;

export const CityCombobox: React.FC<CityComboboxProps> = ({
  options,
  isLoading,
  value,
  onChange,
  onDebouncedSearchTermChange,
  isDisabled = false,
  countryCode,
  error = false,
  showLabel = true,
}) => {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const items = useMemo(
    () => options.map((option) => option.fullCity),
    [options],
  );

  const handleDebouncedSearch = (searchTerm: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchTerm !== (value?.name ?? "")) {
      debounceTimerRef.current = setTimeout(() => {
        onDebouncedSearchTermChange(searchTerm);
      }, 300);
      return;
    }

    onDebouncedSearchTermChange("");
  };

  const disabled = isDisabled || !countryCode || error;

  return (
    <div className="h-12 w-full">
      {showLabel && (
        <Label htmlFor="city-select" className="mb-1 block text-gray-700">
          City
        </Label>
      )}
      <Combobox
        items={items}
        filteredItems={items}
        filter={null}
        value={value}
        onValueChange={(city) => {
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
          }
          onChange(city);
          onDebouncedSearchTermChange("");
        }}
        onInputValueChange={(searchTerm, eventDetails) => {
          if (eventDetails.reason === "item-press") {
            return;
          }
          handleDebouncedSearch(searchTerm);
        }}
        itemToStringLabel={cityLabel}
        isItemEqualToValue={cityEquals}
        disabled={disabled}
      >
        <ComboboxInput
          id="city-select"
          showClear
          className="h-12 text-base"
          placeholder={
            error
              ? "Error loading cities"
              : !countryCode
                ? "Select a country first"
                : "Select a city..."
          }
          autoComplete="nope"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-lpignore="true"
          data-1p-ignore="true"
          data-form-type="other"
        />
        <ComboboxContent className="group/combobox-content">
          {isLoading && <ComboboxStatus>Loading cities...</ComboboxStatus>}
          <ComboboxEmpty>
            {countryCode ? "No cities found" : "Select a country first"}
          </ComboboxEmpty>
          <ComboboxList>
            {(city: City) => (
              <ComboboxItem key={city.id} value={city}>
                {city.name}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {error && countryCode && (
        <p className="mt-1 text-sm text-red-500">
          Failed to load cities. Please try again.
        </p>
      )}
    </div>
  );
};
