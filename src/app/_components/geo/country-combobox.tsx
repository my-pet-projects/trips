"use client";

import React, { useMemo } from "react";
import Select, {
  components,
  type OptionProps,
  type SingleValueProps,
} from "react-select";

import { getFlagEmoji } from "~/lib/utils";
import type { RouterOutputs } from "~/trpc/react";

type Country = RouterOutputs["geo"]["getCountries"][number];

export interface CountrySelectOption {
  value: string;
  label: string;
  fullCountry: Country;
}

interface CountryComboboxProps {
  options: CountrySelectOption[];
  isLoading: boolean;
  value: Country | null;
  onChange: (country: Country | null) => void;
  error?: boolean;
}

export const CountryCombobox: React.FC<CountryComboboxProps> = ({
  options,
  isLoading,
  value,
  onChange,
  error = false,
}) => {
  const selectedOption = value
    ? { value: value.cca2, label: value.name, fullCountry: value }
    : null;

  const customComponents = useMemo(
    () => ({
      Option: (props: OptionProps<CountrySelectOption>) => (
        <components.Option {...props}>
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none">
              {getFlagEmoji(props.data.fullCountry.cca2)}
            </span>
            <span>{props.data.label}</span>
          </div>
        </components.Option>
      ),
      SingleValue: (props: SingleValueProps<CountrySelectOption>) => (
        <components.SingleValue {...props}>
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none">
              {getFlagEmoji(props.data.fullCountry.cca2)}
            </span>
            <span>{props.data.label}</span>
          </div>
        </components.SingleValue>
      ),
    }),
    [],
  );

  return (
    <div className="w-full">
      <label
        htmlFor="country-select"
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        Country
      </label>
      <Select<CountrySelectOption>
        instanceId="country-select"
        inputId="country-select"
        options={options}
        isLoading={isLoading}
        loadingMessage={() => "Loading countries..."}
        value={selectedOption}
        onChange={(option) => onChange(option?.fullCountry ?? null)}
        isClearable
        isDisabled={error}
        placeholder={error ? "Error loading countries" : "Select a country..."}
        noOptionsMessage={() => "No countries found"}
        components={customComponents}
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
      {error && (
        <p className="mt-1 text-sm text-red-500">
          Failed to load countries. Please try again.
        </p>
      )}
    </div>
  );
};
