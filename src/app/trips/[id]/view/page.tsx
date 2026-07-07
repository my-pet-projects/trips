import { notFound } from "next/navigation";

import { MapPageLayout } from "~/app/_components/map-page-layout";
import { Navbar } from "~/app/_components/navbar";
import { TripModeNav } from "~/app/trips/_components/trip-mode-nav";
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

export default async function TripViewPage({ params }: TripViewPageProps) {
  const { id } = await params;
  const tripId = parseInt(id, 10);

  if (isNaN(tripId)) {
    notFound();
  }

  const { trip, attractions } = await api.trip.getTripViewData({
    id: tripId,
  });

  return (
    <MapPageLayout
      navbar={
        <Navbar
          title={trip.name}
          subtitle="View your itinerary"
          backHref="/trips"
          actions={<TripModeNav tripId={tripId} />}
        />
      }
    >
      <div className="container mx-auto flex h-full min-h-0 flex-col px-4">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col">
          <ItineraryViewer trip={trip} tripAttractions={attractions} />
        </div>
      </div>
    </MapPageLayout>
  );
}
