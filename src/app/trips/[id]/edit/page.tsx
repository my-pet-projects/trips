import { notFound } from "next/navigation";

import { Navbar } from "~/app/_components/navbar";
import { TripForm } from "~/app/trips/_components/trip-form";
import { TripModeNav } from "~/app/trips/_components/trip-mode-nav";
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
        actions={<TripModeNav tripId={tripId} />}
      />

      <main className="container mx-auto px-4 py-8">
        <TripForm mode="edit" trip={trip} />
      </main>
    </div>
  );
}
