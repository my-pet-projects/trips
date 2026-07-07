import { MapPageLayout } from "~/app/_components/map-page-layout";
import { Navbar } from "~/app/_components/navbar";
import { Skeleton } from "~/app/_components/ui/skeleton";

export default function ItineraryLoading() {
  return (
    <MapPageLayout
      navbar={
        <Navbar title="Trip Itinerary" subtitle="Loading itinerary..." backHref="/trips" />
      }
    >
      <p className="sr-only" role="status">
        Loading itinerary...
      </p>
      <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-2">
        <div className="space-y-4 overflow-y-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-40" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-lg" />
          ))}
        </div>
        <div className="min-h-[45vh] overflow-hidden border-t border-gray-200 lg:min-h-0 lg:border-t-0 lg:border-l">
          <Skeleton className="h-full w-full rounded-none" />
        </div>
      </div>
    </MapPageLayout>
  );
}
