import { Navbar } from "~/app/_components/navbar";
import {
  Card,
  CardContent,
  CardHeader,
} from "~/app/_components/ui/card";
import { Skeleton } from "~/app/_components/ui/skeleton";

export default function EditTripLoading() {
  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50">
      <Navbar
        title="Edit Trip"
        subtitle="Loading trip details..."
        backHref="/trips"
        actions={
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-20 rounded-md" />
            ))}
          </div>
        }
      />

      <main className="container mx-auto px-4 py-8">
        <p className="sr-only" role="status">
          Loading trip details...
        </p>
        <div className="mx-auto max-w-4xl space-y-6">
          <Card className="border border-gray-200 bg-white shadow-sm ring-0">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-12 w-full rounded-md" />
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-12 w-full rounded-md" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-12 w-full rounded-md" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-12 w-full rounded-md" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white shadow-sm ring-0">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-36" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Skeleton className="h-24 w-full rounded-lg" />
            </CardContent>
          </Card>

          <Skeleton className="h-px w-full" />

          <div className="flex justify-end gap-3">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-36 rounded-md" />
          </div>
        </div>
      </main>
    </div>
  );
}
