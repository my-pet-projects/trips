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
import type { Country } from "~/types";

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
  compact?: boolean;
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
  compact?: boolean;
}

const getSelectClassNames = ({
  isDisabled,
  hasError,
  isMulti,
  compact,
}: SelectClassNamesArgs) => ({
  control: (state: { isFocused: boolean; isDisabled: boolean }) =>
    `!w-full !rounded-lg !border ${
      state.isFocused
        ? "!border-orange-500 !ring-1 !ring-orange-500"
        : hasError
          ? "!border-red-500"
          : "!border-gray-300"
    } !bg-gray-50 ${
      isMulti ? "!min-h-[3rem]" : compact ? "!h-8 !min-h-0" : "!h-12"
    } ${compact ? "!text-xs" : "!text-base"} ${state.isDisabled || isDisabled ? "!bg-gray-200" : ""}`,
  placeholder: () => compact ? "!text-gray-400 !text-xs !truncate" : "!text-gray-400",
  singleValue: () => "!truncate",
  input: () => compact ? "!text-xs" : "",
  indicatorSeparator: () => "!bg-gray-300",
  dropdownIndicator: () => compact ? "!text-gray-400 hover:!text-gray-500 !p-1" : "!text-gray-400 hover:!text-gray-500",
  clearIndicator: () => compact ? "!text-gray-400 hover:!text-red-500 !p-1" : "!text-gray-400 hover:!text-red-500",
  menu: () => "!rounded-lg !shadow-md !mt-2 !z-[1000]",
  option: (state: { isSelected: boolean; isFocused: boolean }) =>
    `${compact ? "!text-xs !py-1" : ""} !text-gray-800 ${
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
  props: OptionProps<CountrySelectOption, boolean, GroupBase<CountrySelectOption>>,
) => (
  <components.Option {...props}>
    <div className="flex items-center gap-2">
      <span className="text-xl leading-none">{getFlagEmoji(props.data.fullCountry.cca2)}</span>
      <span>{props.data.label}</span>
    </div>
  </components.Option>
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
) => (
  <components.Input
    {...props}
    autoComplete="nope"
    autoCorrect="off"
    autoCapitalize="off"
    spellCheck={false}
    data-lpignore="true"
    data-1p-ignore="true"
    data-form-type="other"
  />
);

const CountryComboboxSingle: React.FC<CountryComboboxSingleProps> = ({
  options,
  isLoading,
  disabled,
  error = false,
  showLabel = true,
  placeholder,
  compact,
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
      Option: ((props) => {
        return (
          <components.Option {...props}>
            <div className="flex items-center gap-2">
              <span className={compact ? "text-sm leading-none" : "text-xl leading-none"}>
                {getFlagEmoji(props.data.fullCountry.cca2)}
              </span>
              <span className={compact ? "text-xs" : ""}>{props.data.label}</span>
            </div>
          </components.Option>
        );
      }) as React.ComponentType<OptionProps<CountrySelectOption, false, GroupBase<CountrySelectOption>>>,
      SingleValue: ((props) => {
        return (
          <components.SingleValue {...props}>
            <div className="flex items-center gap-2">
              <span className={compact ? "text-sm leading-none" : "text-xl leading-none"}>
                {getFlagEmoji(props.data.fullCountry.cca2)}
              </span>
              <span className={compact ? "text-xs" : ""}>{props.data.label}</span>
            </div>
          </components.SingleValue>
        );
      }) as React.ComponentType<SingleValueProps<CountrySelectOption, false, GroupBase<CountrySelectOption>>>,
      Input: CustomInput as React.ComponentType<
        InputProps<CountrySelectOption, false, GroupBase<CountrySelectOption>>
      >,
    }),
    [compact],
  );

  return (
    <div className="w-full" data-testid="country-select-container">
      {showLabel && (
        <div className="mb-1.5 block text-sm font-medium text-gray-700">
          Country
        </div>
      )}
      <Select<CountrySelectOption, false, GroupBase<CountrySelectOption>>
        instanceId="country-select-single"
        inputId="country-select-single"
        aria-label="Country"
        options={options}
        isLoading={isLoading}
        loadingMessage={() => compact ? "Loading…" : "Loading countries..."}
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
          compact,
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
        <div className="mb-1.5 block text-sm font-medium text-gray-700">
          Countries
        </div>
      )}
      <Select<CountrySelectOption, true, GroupBase<CountrySelectOption>>
        instanceId="country-select-multi"
        inputId="country-select-multi"
        aria-label="Countries"
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
