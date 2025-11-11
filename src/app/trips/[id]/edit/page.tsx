import { ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TripForm } from "~/app/_components/forms/trip-form";
import { api } from "~/trpc/server";

export const metadata = {
  title: "Edit Trip Details",
  description: "Update information about the trip",
};

type EditTripPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditTripPage({ params }: EditTripPageProps) {
  const { id } = await params;
  const tripId = parseInt(id, 10);

  if (isNaN(tripId)) {
    notFound();
  }

  const trip = await api.trip.getTripById({ id: tripId });
  if (!trip) {
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
                href={`/trips`}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100">
                <Calendar className="h-6 w-6 text-sky-600" />
              </div>
              <div>
                <h1 className="text-foreground text-2xl font-bold">
                  Edit Trip
                </h1>
                <p className="text-muted-foreground text-sm">
                  Update your trip details
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <TripForm mode="edit" trip={trip} />
      </main>
    </div>
  );
}
