import { MapPin } from "lucide-react";

import { SearchBar } from "./_components/search-bar";

type SearchParams = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    countryCode?: string;
    cityId?: string;
  }>;
};

export default async function AttractionsPage({ searchParams }: SearchParams) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search ?? "";
  const countryCode = params.countryCode ?? "";
  const cityId = params.cityId ? Number(params.cityId) : undefined;

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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <SearchBar
          initialSearch={search}
          initialCountryCode={countryCode}
          initialCityId={cityId}
        />
      </main>
    </div>
  );
}
