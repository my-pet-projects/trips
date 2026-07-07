import { Calendar, Eye } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Navbar } from "~/app/_components/navbar";
import { TripForm } from "~/app/trips/_components/trip-form";
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
      <Navbar
        title={trip.name}
        subtitle="Edit trip details"
        backHref="/trips"
        actions={
          <>
            <Link
              href={`/trips/${tripId}/itinerary`}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Itinerary
            </Link>
            <Link
              href={`/trips/${tripId}/view`}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
            >
              <Eye className="mr-2 h-4 w-4" />
              View
            </Link>
          </>
        }
      />

      <main className="container mx-auto px-4 py-8">
        <TripForm mode="edit" trip={trip} />
      </main>
    </div>
  );
}
