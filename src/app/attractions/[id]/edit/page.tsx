import { ArrowLeft, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AttractionForm } from "~/app/_components/forms/attraction-form";
import { api } from "~/trpc/server";

type EditAttractionPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata = {
  title: "Edit Attraction Details",
  description: "Update information about the attraction",
};

export default async function EditAttractionPage({
  params,
}: EditAttractionPageProps) {
  const { id } = await params;
  const attractionId = parseInt(id, 10);

  if (isNaN(attractionId)) {
    notFound();
  }

  const attraction = await api.attraction.getAttractionById({
    id: attractionId,
  });
  if (!attraction) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/attractions"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-foreground text-2xl font-bold">
                  Edit Attraction
                </h1>
                <p className="text-muted-foreground text-sm">
                  Update attraction details
                </p>
              </div>
            </div>

            <nav className="flex items-center gap-4">
              <Link
                href={`/attractions/new?isNew=true&country=${attraction.countryCode}&city=${attraction.city.name}`}
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Attraction in Same Location
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <AttractionForm attraction={attraction} mode="edit" />
      </main>
    </div>
  );
}
