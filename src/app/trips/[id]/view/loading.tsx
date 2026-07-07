import { MapPageLayout } from "~/app/_components/map-page-layout";
import { Navbar } from "~/app/_components/navbar";
import { Skeleton } from "~/app/_components/ui/skeleton";

export default function TripViewLoading() {
  return (
    <MapPageLayout
      navbar={
        <Navbar title="Trip View" subtitle="Loading trip view..." backHref="/trips" />
      }
    >
      <p className="sr-only" role="status">
        Loading trip view...
      </p>
      <div className="container mx-auto flex h-full min-h-0 flex-col px-4">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col bg-gray-50">
        <div className="border-b border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <Skeleton className="h-full w-full rounded-none" />
        </div>
        <div className="border-t border-gray-200 bg-white p-4">
          <Skeleton className="mb-3 h-4 w-48" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        </div>
        </div>
      </div>
    </MapPageLayout>
  );
}
