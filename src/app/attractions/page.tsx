import { MapPin, Plane, Plus } from "lucide-react";
import Link from "next/link";

import { api } from "~/trpc/server";
import { AttractionsTable } from "./_components/attractions-table";
import { SearchBar } from "./_components/search-bar";

type SearchParams = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    country?: string;
    city?: string;
  }>;
};

export default async function AttractionsPage({ searchParams }: SearchParams) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10) || 1;
  const search = params.search ?? "";
  const country = params.country ?? "";
  const city = params.city ?? "";
  const itemsPerPage = 20;

  const attractions = await api.attraction.paginateAttractions({
    limit: itemsPerPage,
    offset: (page - 1) * itemsPerPage,
    search: search || undefined,
    country: country || undefined,
    city: city || undefined,
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-foreground text-2xl font-bold">
                  Attractions
                </h1>
                <p className="text-muted-foreground text-sm">
                  Discover and manage places to visit
                </p>
              </div>
            </div>
            <nav className="flex items-center gap-4">
              <Link
                href="/trips"
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
              >
                <Plane className="mr-2 h-4 w-4" />
                My Trips
              </Link>
              <Link
                href="/attractions/new"
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Attraction
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <SearchBar
          initialSearch={search}
          initialCountry={country}
          initialCity={city}
        />
        <AttractionsTable
          attractions={attractions.attractions}
          totalCount={attractions.pagination.total}
          currentPage={page}
          itemsPerPage={itemsPerPage}
        />
      </main>
    </div>
  );
}
