"use client";

import React, { useMemo } from "react";
import Select, {
  components,
  type GroupBase,
  type InputProps,
  type MultiValue,
  type MultiValueProps,
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

interface CountryComboboxBaseProps {
  options: CountrySelectOption[];
  isLoading: boolean;
  error?: boolean;
  showLabel?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

interface CountryComboboxSingleProps extends CountryComboboxBaseProps {
  multiple?: false;
  value: Country | null;
  onChange: (country: Country | null) => void;
}

interface CountryComboboxMultiProps extends CountryComboboxBaseProps {
  multiple: true;
  value: Country[];
  onChange: (countries: Country[]) => void;
}

type CountryComboboxProps =
  | CountryComboboxSingleProps
  | CountryComboboxMultiProps;

interface SelectClassNamesArgs {
  isFocused: boolean;
  isDisabled: boolean;
  hasError: boolean;
  isMulti: boolean;
}

const getSelectClassNames = ({
  isDisabled,
  hasError,
  isMulti,
}: SelectClassNamesArgs) => ({
  control: (state: { isFocused: boolean; isDisabled: boolean }) =>
    `!w-full !rounded-lg !border ${
      state.isFocused
        ? "!border-orange-500 !ring-1 !ring-orange-500"
        : hasError
          ? "!border-red-500"
          : "!border-gray-300"
    } !bg-gray-50 ${
      isMulti ? "!min-h-[3rem]" : "!h-12"
    } !text-base ${state.isDisabled || isDisabled ? "!bg-gray-200" : ""}`,
  placeholder: () => "!text-gray-400",
  singleValue: () => "!truncate",
  input: () => "",
  indicatorSeparator: () => "!bg-gray-300",
  dropdownIndicator: () => "!text-gray-400 hover:!text-gray-500",
  clearIndicator: () => "!text-gray-400 hover:!text-red-500",
  menu: () => "!rounded-lg !shadow-md !mt-2",
  option: (state: { isSelected: boolean; isFocused: boolean }) =>
    `!text-gray-800 ${
      state.isSelected
        ? "!bg-orange-200 !text-orange-700"
        : state.isFocused
          ? "!bg-orange-50"
          : "!bg-white"
    }`,
  multiValue: () => "!bg-orange-100 !rounded-md",
  multiValueLabel: () => "!text-orange-900 !px-2",
  multiValueRemove: () =>
    "!text-orange-700 hover:!bg-orange-200 hover:!text-orange-900",
});

const CustomOption = (
  props: OptionProps<
    CountrySelectOption,
    boolean,
    GroupBase<CountrySelectOption>
  >,
) => (
  <components.Option {...props}>
    <div className="flex items-center gap-2">
      <span className="text-xl leading-none">
        {getFlagEmoji(props.data.fullCountry.cca2)}
      </span>
      <span>{props.data.label}</span>
    </div>
  </components.Option>
);

const CustomSingleValue = (
  props: SingleValueProps<
    CountrySelectOption,
    false,
    GroupBase<CountrySelectOption>
  >,
) => (
  <components.SingleValue {...props}>
    <div className="flex items-center gap-2">
      <span className="text-xl leading-none">
        {getFlagEmoji(props.data.fullCountry.cca2)}
      </span>
      <span>{props.data.label}</span>
    </div>
  </components.SingleValue>
);

const CustomMultiValue = (
  props: MultiValueProps<
    CountrySelectOption,
    true,
    GroupBase<CountrySelectOption>
  >,
) => (
  <components.MultiValue {...props}>
    <div className="flex items-center gap-1.5">
      <span className="text-base leading-none">
        {getFlagEmoji(props.data.fullCountry.cca2)}
      </span>
      <span className="text-sm">{props.data.label}</span>
    </div>
  </components.MultiValue>
);

const CustomInput = (
  props: InputProps<
    CountrySelectOption,
    boolean,
    GroupBase<CountrySelectOption>
  >,
) => <components.Input {...props} autoComplete="off" />;

const CountryComboboxSingle: React.FC<CountryComboboxSingleProps> = ({
  options,
  isLoading,
  disabled,
  error = false,
  showLabel = true,
  placeholder,
  value,
  onChange,
}) => {
  const selectedOption = value
    ? {
        value: value.cca2,
        label: value.name,
        fullCountry: value,
      }
    : null;

  const handleSingleChange = (newValue: CountrySelectOption | null) => {
    onChange(newValue?.fullCountry ?? null);
  };

  const singleSelectComponents = useMemo(
    () => ({
      Option: CustomOption as React.ComponentType<
        OptionProps<CountrySelectOption, false, GroupBase<CountrySelectOption>>
      >,
      SingleValue: CustomSingleValue,
      Input: CustomInput as React.ComponentType<
        InputProps<CountrySelectOption, false, GroupBase<CountrySelectOption>>
      >,
    }),
    [],
  );

  return (
    <div className="w-full">
      {showLabel && (
        <label
          htmlFor="country-select-single"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Country
        </label>
      )}
      <Select<CountrySelectOption, false, GroupBase<CountrySelectOption>>
        instanceId="country-select-single"
        inputId="country-select-single"
        options={options}
        isLoading={isLoading}
        loadingMessage={() => "Loading countries..."}
        value={selectedOption}
        onChange={handleSingleChange}
        isClearable
        isDisabled={error || isLoading || disabled}
        placeholder={
          placeholder ??
          (error ? "Error loading countries" : "Select a country...")
        }
        noOptionsMessage={() => "No countries found"}
        components={singleSelectComponents}
        classNames={getSelectClassNames({
          isFocused: false,
          isDisabled: error || isLoading,
          hasError: error,
          isMulti: false,
        })}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">
          Failed to load countries. Please try again.
        </p>
      )}
    </div>
  );
};

const CountryComboboxMulti: React.FC<CountryComboboxMultiProps> = ({
  options,
  isLoading,
  disabled,
  error = false,
  showLabel = true,
  placeholder,
  value,
  onChange,
}) => {
  const selectedOptions: readonly CountrySelectOption[] = value.map(
    (country) => ({
      value: country.cca2,
      label: country.name,
      fullCountry: country,
    }),
  );

  const handleMultiChange = (newValue: MultiValue<CountrySelectOption>) => {
    const countries = newValue ? newValue.map((opt) => opt.fullCountry) : [];
    onChange(countries);
  };

  const multiSelectComponents = useMemo(
    () => ({
      Option: CustomOption as React.ComponentType<
        OptionProps<CountrySelectOption, true, GroupBase<CountrySelectOption>>
      >,
      MultiValue: CustomMultiValue,
      Input: CustomInput as React.ComponentType<
        InputProps<CountrySelectOption, true, GroupBase<CountrySelectOption>>
      >,
    }),
    [],
  );

  return (
    <div className="w-full">
      {showLabel && (
        <label
          htmlFor="country-select-multi"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Countries
        </label>
      )}
      <Select<CountrySelectOption, true, GroupBase<CountrySelectOption>>
        instanceId="country-select-multi"
        inputId="country-select-multi"
        options={options}
        isLoading={isLoading}
        loadingMessage={() => "Loading countries..."}
        value={selectedOptions}
        onChange={handleMultiChange}
        isMulti
        isClearable
        isDisabled={error || isLoading || disabled}
        placeholder={
          placeholder ??
          (error ? "Error loading countries" : "Select countries...")
        }
        noOptionsMessage={() => "No countries found"}
        components={multiSelectComponents}
        classNames={getSelectClassNames({
          isFocused: false,
          isDisabled: error || isLoading,
          hasError: error,
          isMulti: true,
        })}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">
          Failed to load countries. Please try again.
        </p>
      )}
    </div>
  );
};

export const CountryCombobox: React.FC<CountryComboboxProps> = (props) => {
  if (props.multiple) {
    return <CountryComboboxMulti {...props} />;
  } else {
    return <CountryComboboxSingle {...props} />;
  }
};
