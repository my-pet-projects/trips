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

type SearchBarProps = {
  initialSearch: string;
  initialCountryCode: string;
  initialCityId: number | undefined;
};

export function SearchBar({
  initialSearch,
  initialCountryCode,
  initialCityId,
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  // Update search query when URL changes (e.g., browser back/forward)
  useEffect(() => {
    setSearchQuery(initialSearch);
  }, [initialSearch]);

  // Debounce search
  useEffect(() => {
    if (searchQuery === initialSearch) return; // Don't trigger on mount

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
  }, [searchQuery]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCountryCityChange = useCallback(
    (countryCode: string, cityId: number | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (countryCode) {
        params.set("countryCode", countryCode);
      } else {
        params.delete("countryCode");
      }

      if (cityId) {
        params.set("cityId", cityId.toString());
      } else {
        params.delete("cityId");
      }

      params.delete("page"); // Reset to first page on filter change

      startTransition(() => {
        router.push(`/attractions?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search attractions by name, location, or category..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="h-10 w-full pr-10 pl-9"
          />
          {isPending && (
            <div className="absolute top-1/2 right-3 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            </div>
          )}
        </div>

        {/* Location Filters */}
        <div className="w-full shrink-0 lg:w-auto">
          <CountryCitySelector
            initialCountryCode={initialCountryCode}
            initialCityId={initialCityId}
            onChange={handleCountryCityChange}
          />
        </div>
      </div>
    </div>
  );
}
