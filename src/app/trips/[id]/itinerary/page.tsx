import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { api } from "~/trpc/server";
import { ItineraryPlanner } from "./_components/itinerary_planner";

type ItineraryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata = {
  title: "Trip Itinerary",
  description: "Plan your daily activities and attractions",
};

export default async function ItineraryPage({ params }: ItineraryPageProps) {
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
                <MapPin className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <h1 className="text-foreground text-2xl font-bold">
                  {trip.name}
                </h1>
                <p className="text-muted-foreground text-sm">
                  Plan your itinerary
                </p>
              </div>
            </div>
            <Link
              href={`/trips/${tripId}/edit`}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Edit Trip
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <ItineraryPlanner trip={trip} tripAttractions={attractions} />
      </main>
    </div>
  );
}
