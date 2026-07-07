import { Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Navbar } from "~/app/_components/navbar";
import { buttonVariants } from "~/app/_components/ui/button";
import { cn } from "~/lib/utils";
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
    <div className="flex h-dvh flex-col overflow-hidden bg-linear-to-br from-sky-50 via-white to-orange-50">
      <Navbar
        title={trip.name}
        subtitle="View your itinerary"
        backHref="/trips"
        actions={
          <Link
            href={`/trips/${tripId}/edit`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <Pencil className="h-4 w-4" />
            Edit Trip
          </Link>
        }
      />

      {/* Main Content */}
      <main className="container mx-auto min-h-0 flex-1">
        <ItineraryViewer trip={trip} tripAttractions={attractions} />
      </main>
    </div>
  );
}
