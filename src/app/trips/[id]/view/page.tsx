import { Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Navbar } from "~/app/_components/navbar";
import { api } from "~/trpc/server";
import { ItineraryViewer } from "./_components/itinerary-viewer";

type TripViewPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata = {
  title: "Trip View",
  description: "View your trip itinerary",
};

export default async function ItineraryPage({ params }: TripViewPageProps) {
  const { id } = await params;
  const tripId = parseInt(id, 10);

  if (isNaN(tripId)) {
    notFound();
  }

  const trip = await api.trip.getWithItinerary({ id: tripId });
  if (!trip) {
    notFound();
  }

  const attractions = await api.attraction.getAttractionsByCountries({
    countryCodes: trip.destinations.map((d) => d.countryCode),
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50">
      <div className="hidden md:block">
        <Navbar
          title={trip.name}
          subtitle="View your itinerary"
          backHref="/trips"
          actions={
            <Link
              href={`/trips/${tripId}/edit`}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Trip
            </Link>
          }
        />
      </div>

      {/* Main Content */}
      <main className="md:container md:mx-auto md:px-4 md:py-6">
        <ItineraryViewer trip={trip} tripAttractions={attractions} />
      </main>
    </div>
  );
}
