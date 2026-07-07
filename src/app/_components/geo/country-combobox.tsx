"use client";

import React from "react";

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxStatus,
  ComboboxValue,
  useComboboxAnchor,
} from "~/app/_components/ui/combobox";
import { getFlagEmoji, cn } from "~/lib/utils";
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

const countryLabel = (country: Country) => country.name;
const countryEquals = (a: Country, b: Country) => a.cca2 === b.cca2;

function CountryOptionLabel({
  country,
  compact,
}: {
  country: Country;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={compact ? "text-sm leading-none" : "text-xl leading-none"}>
        {getFlagEmoji(country.cca2)}
      </span>
      <span className={compact ? "text-xs" : undefined}>{country.name}</span>
    </div>
  );
}

function CountryChipLabel({ country }: { country: Country }) {
  return (
    <>
      <span className="text-sm leading-none">{getFlagEmoji(country.cca2)}</span>
      <span>{country.name}</span>
    </>
  );
}

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
  const items = React.useMemo(
    () => options.map((option) => option.fullCountry),
    [options],
  );

  return (
    <div className="w-full" data-testid="country-select-container">
      {showLabel && (
        <div className="mb-1.5 block text-sm font-medium text-gray-700">
          Country
        </div>
      )}
      <Combobox
        items={items}
        value={value}
        onValueChange={(nextValue) => onChange(nextValue)}
        itemToStringLabel={countryLabel}
        isItemEqualToValue={countryEquals}
        disabled={error || isLoading || disabled}
      >
        <ComboboxInput
          id="country-select-single"
          aria-label="Country"
          showClear
          startAdornment={
            value ? (
              <span
                className={cn(
                  "shrink-0 pl-1 leading-none",
                  compact ? "text-sm" : "text-xl",
                )}
                aria-hidden
              >
                {getFlagEmoji(value.cca2)}
              </span>
            ) : null
          }
          placeholder={
            placeholder ??
            (error ? "Error loading countries" : "Select a country...")
          }
          className={cn(
            compact ? "h-8 min-h-0 text-xs" : "h-12 text-base",
            error && "border-red-500",
          )}
          autoComplete="nope"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-lpignore="true"
          data-1p-ignore="true"
          data-form-type="other"
        />
        <ComboboxContent className="group/combobox-content">
          {isLoading && (
            <ComboboxStatus>
              {compact ? "Loading…" : "Loading countries..."}
            </ComboboxStatus>
          )}
          <ComboboxEmpty>No countries found</ComboboxEmpty>
          <ComboboxList>
            {(country: Country) => (
              <ComboboxItem
                key={country.cca2}
                value={country}
                className={compact ? "py-1 text-xs" : undefined}
              >
                <CountryOptionLabel country={country} compact={compact} />
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
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
  const anchor = useComboboxAnchor();
  const items = React.useMemo(
    () => options.map((option) => option.fullCountry),
    [options],
  );

  return (
    <div className="w-full">
      {showLabel && (
        <div className="mb-1.5 block text-sm font-medium text-gray-700">
          Countries
        </div>
      )}
      <Combobox
        multiple
        items={items}
        value={value}
        onValueChange={onChange}
        itemToStringLabel={countryLabel}
        isItemEqualToValue={countryEquals}
        disabled={error || isLoading || disabled}
      >
        <ComboboxChips ref={anchor}>
          <ComboboxValue>
            {(countries: Country[]) =>
              countries.map((country) => (
                <ComboboxChip key={country.cca2}>
                  <CountryChipLabel country={country} />
                </ComboboxChip>
              ))
            }
          </ComboboxValue>
          <ComboboxChipsInput
            id="country-select-multi"
            aria-label="Countries"
            placeholder={
              placeholder ??
              (error ? "Error loading countries" : "Select countries...")
            }
            autoComplete="nope"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-lpignore="true"
            data-1p-ignore="true"
            data-form-type="other"
          />
        </ComboboxChips>
        <ComboboxContent anchor={anchor} className="group/combobox-content">
          {isLoading && (
            <ComboboxStatus>Loading countries...</ComboboxStatus>
          )}
          <ComboboxEmpty>No countries found</ComboboxEmpty>
          <ComboboxList>
            {(country: Country) => (
              <ComboboxItem key={country.cca2} value={country}>
                <CountryOptionLabel country={country} />
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
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
  }

  return <CountryComboboxSingle {...props} />;
};
