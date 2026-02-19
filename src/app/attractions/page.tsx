import { Navbar } from "~/app/_components/navbar";
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
      <Navbar
        title="Attractions"
        subtitle="Discover and manage places to visit"
      />

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
