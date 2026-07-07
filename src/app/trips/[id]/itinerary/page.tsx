import { notFound } from "next/navigation";

import { MapPageLayout } from "~/app/_components/map-page-layout";
import { Navbar } from "~/app/_components/navbar";
import { TripModeNav } from "~/app/trips/_components/trip-mode-nav";
import { api } from "~/trpc/server";
import { ItineraryPlanner } from "./_components/itinerary-planner";

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

  const { trip, attractions } = await api.trip.getItineraryViewData({
    id: tripId,
  });

  return (
    <MapPageLayout
      navbar={
        <Navbar
          title={trip.name}
          subtitle="Plan your itinerary"
          backHref="/trips"
          actions={<TripModeNav tripId={tripId} />}
        />
      }
    >
      <ItineraryPlanner trip={trip} tripAttractions={attractions} />
    </MapPageLayout>
  );
}
