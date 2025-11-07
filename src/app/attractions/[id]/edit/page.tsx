import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "~/trpc/server";
import { AttractionEditForm } from "./_components/attraction-edit-form";

type EditAttractionPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditAttractionPage({
  params,
}: EditAttractionPageProps) {
  const { id } = await params;
  const attractionId = parseInt(id, 10);

  if (isNaN(attractionId)) {
    // If the ID is not a valid number, trigger a 404
    notFound();
  }

  let attraction;
  let error = null;

  try {
    attraction = await api.attraction.getAttractionById({ id: attractionId });
    if (!attraction) {
      notFound();
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load attraction";
    console.error("Error fetching attraction:", err);
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {error ? (
          <div className="mx-auto max-w-4xl">
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
              <h2 className="mb-2 text-xl font-semibold text-red-900">
                Error Loading Attraction
              </h2>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        ) : attraction ? (
          <AttractionEditForm attraction={attraction} />
        ) : null}
      </main>
    </div>
  );
}
