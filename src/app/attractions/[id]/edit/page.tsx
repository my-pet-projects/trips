import { Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Navbar } from "~/app/_components/navbar";
import { AttractionForm } from "~/app/attractions/_components/forms/attraction-form";
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
      <Navbar
        title="Edit Attraction"
        subtitle="Update attraction details"
        backHref="/attractions"
        actions={
          <Link
            href={`/attractions/new?isNew=true&country=${attraction.countryCode}&city=${attraction.city.name}`}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Attraction in Same Location
          </Link>
        }
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <AttractionForm attraction={attraction} mode="edit" />
      </main>
    </div>
  );
}
