"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";

import { CountryCitySelector } from "~/app/_components/geo/country-city-selector";
import { Input } from "~/app/_components/ui/input";
import type { RouterOutputs } from "~/trpc/react";

type City = RouterOutputs["geo"]["getCitiesByCountry"][number];
type Country = RouterOutputs["geo"]["getCountries"][number];

type SearchBarProps = {
  initialSearch: string;
  initialCountry: string;
  initialCity: string;
};

export function SearchBar({
  initialSearch,
  initialCountry,
  initialCity,
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  // Sync search query with URL changes (e.g., browser back/forward)
  // Only update if the URL param actually changed from external source
  useEffect(() => {
    setSearchQuery(initialSearch);
  }, [initialSearch]);

  // Debounce search input and update URL
  useEffect(() => {
    if (searchQuery === initialSearch) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchQuery) {
        params.set("search", searchQuery);
      } else {
        params.delete("search");
      }
      params.delete("page"); // Reset to first page on search

      startTransition(() => {
        router.push(`/attractions?${params.toString()}`);
      });
    }, 300);

    return () => clearTimeout(timer);
    // Don't include searchParams/router in deps to avoid infinite loops
    // We depend on initialSearch instead, which updates when URL changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, initialSearch]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCountryCityChange = useCallback(
    (country: Country | null, city: City | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (country) {
        params.set("country", country.cca2);
      } else {
        params.delete("country");
      }

      if (city) {
        params.set("city", city.name);
      } else {
        params.delete("city");
      }

      params.delete("page"); // Reset to first page on filter change

      startTransition(() => {
        router.push(`/attractions?${params.toString()}`);
      });
    },
    // Don't include searchParams/router in deps to avoid infinite loops
    // The callback reads fresh searchParams.toString() on each invocation
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="w-full space-y-6 rounded-lg bg-white p-6 shadow-lg sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        {/* Search Input */}
        <div className="relative w-full lg:w-1/3">
          <label htmlFor="attraction-search" className="sr-only">
            Search attractions
          </label>
          <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            id="attraction-search"
            placeholder="Search attractions by name, location, or category..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="h-12 w-full rounded-lg border border-gray-300 bg-gray-50 pr-12 pl-12 text-base shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
          {isPending && (
            <div
              className="absolute top-1/2 right-4 z-10 -translate-y-1/2"
              role="status"
            >
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              <span className="sr-only">Searching...</span>
            </div>
          )}
        </div>

        {/* Location Filters */}
        <div className="w-full lg:flex-1">
          <CountryCitySelector
            initialCountry={initialCountry}
            initialCity={initialCity}
            onChange={handleCountryCityChange}
            showLabels={false}
          />
        </div>
      </div>
    </div>
  );
}
