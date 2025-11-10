"use client";

import { TRPCClientError } from "@trpc/client";
import {
  Calendar,
  Loader2,
  MapPin,
  MoreVertical,
  Pencil,
  Plane,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/app/_components/ui/alert-dialog";
import { Button } from "~/app/_components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/app/_components/ui/dropdown-menu";
import { api, type RouterOutputs } from "~/trpc/react";

type Trip = RouterOutputs["trip"]["listTrips"][number];

const getErrorMessage = (error: unknown): string => {
  if (error instanceof TRPCClientError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
};

const formatDateRange = (startDate: Date, endDate: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };

  const startStr = startDate.toLocaleDateString("en-US", options);
  const endStr = endDate.toLocaleDateString("en-US", options);

  return `${startStr} - ${endStr}`;
};

const getTripStatus = (
  startDate: Date,
  endDate: Date,
): {
  label: string;
  color: string;
} => {
  const now = new Date();

  if (now < startDate) {
    return { label: "Upcoming", color: "bg-blue-100 text-blue-700" };
  } else if (now > endDate) {
    return { label: "Completed", color: "bg-gray-100 text-gray-700" };
  } else {
    return { label: "In Progress", color: "bg-green-100 text-green-700" };
  }
};

function TripCard({
  trip,
  onDelete,
}: {
  trip: Trip;
  onDelete: (id: number) => void;
}) {
  const { id, name, startDate, endDate, destinations } = trip;

  const parsedStartDate = new Date(startDate);
  const parsedEndDate = new Date(endDate);

  const status = getTripStatus(parsedStartDate, parsedEndDate);

  return (
    <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:border-orange-300 hover:shadow-md">
      <Link href={`/trips/${id}`} className="block">
        <div className="p-6">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-orange-600">
                {name}
              </h3>
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{formatDateRange(parsedStartDate, parsedEndDate)}</span>
              </div>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${status.color}`}
            >
              {status.label}
            </span>
          </div>

          {/* Destinations */}
          {destinations.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <MapPin className="h-4 w-4" />
                <span>Destinations ({destinations.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {destinations.slice(0, 5).map((dest) => (
                  <div
                    key={dest.id}
                    className="rounded-md bg-gray-100 px-3 py-1 text-sm text-gray-700"
                  >
                    {dest.country?.name}
                  </div>
                ))}
                {destinations.length > 5 && (
                  <div
                    className="rounded-md bg-gray-100 px-3 py-1 text-sm text-gray-500"
                    title={destinations
                      .slice(5)
                      .map((d) => d.country?.name)
                      .join(", ")}
                  >
                    +{destinations.length - 5} more
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-2 text-sm text-gray-500">
              No destinations added
            </div>
          )}
        </div>
      </Link>

      {/* Actions Menu */}
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => e.preventDefault()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/trips/${id}/edit`} className="flex items-center">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                onDelete(id);
              }}
              className="text-red-600 focus:text-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
      <div className="text-center">
        <MapPin className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          No trips yet
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Start your adventure by creating your first trip.
        </p>
        <Button asChild className="mt-6 bg-orange-500 hover:bg-orange-600">
          <Link href="/trips/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Trip
          </Link>
        </Button>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-gray-400" />
        <p className="mt-4 text-sm text-gray-600">
          Loading your travel plans...
        </p>
      </div>
    </div>
  );
}

export function TripsListPage() {
  const utils = api.useUtils();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<number | null>(null);

  const { data: trips, isLoading } = api.trip.listTrips.useQuery();

  const deleteMutation = api.trip.deleteTrip.useMutation({
    onSuccess: () => {
      toast.success("Trip deleted", {
        description: "The trip has been deleted successfully.",
      });
      setDeleteDialogOpen(false);
      setTripToDelete(null);
      void utils.trip.listTrips.invalidate();
    },
    onError: (err) => {
      toast.error("Failed to delete trip", {
        description: getErrorMessage(err),
      });
    },
  });

  const handleDeleteClick = (id: number) => {
    setTripToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (tripToDelete) {
      deleteMutation.mutate({ id: tripToDelete });
    }
  };

  const { upcomingTrips, activeTrips, pastTrips } = useMemo(() => {
    const now = new Date();
    const upcoming: Trip[] = [];
    const active: Trip[] = [];
    const past: Trip[] = [];

    trips?.forEach((trip) => {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);

      if (now < start) {
        upcoming.push(trip);
      } else if (now > end) {
        past.push(trip);
      } else {
        active.push(trip);
      }
    });

    return { upcomingTrips: upcoming, activeTrips: active, pastTrips: past };
  }, [trips]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
          <p className="mt-2 text-sm text-gray-600">
            Plan and manage your travel adventures
          </p>
        </div>
        <Button
          asChild
          className="bg-orange-500 hover:bg-orange-600"
          size="lg"
          disabled={isLoading}
        >
          <Link href="/trips/new">
            <Plus className="mr-2 h-5 w-5" />
            New Trip
          </Link>
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState />
      ) : !trips || trips.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-8">
          {/* Active Trips */}
          {activeTrips.length > 0 && (
            <div>
              <h2 className="mb-4 border-b border-gray-200 pb-2 text-xl font-semibold text-gray-900">
                Active Trips
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {activeTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Trips */}
          {upcomingTrips.length > 0 && (
            <div>
              <h2 className="mb-4 border-b border-gray-200 pb-2 text-xl font-semibold text-gray-900">
                Upcoming Trips
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past Trips */}
          {pastTrips.length > 0 && (
            <div>
              <h2 className="mb-4 border-b border-gray-200 pb-2 text-xl font-semibold text-gray-900">
                Past Trips
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {pastTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trip</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this trip? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className={`bg-red-600 hover:bg-red-700 ${deleteMutation.isPending ? "cursor-not-allowed opacity-70" : ""}`}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function TripsPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-foreground text-2xl font-bold">Trips</h1>
                <p className="text-muted-foreground text-sm">
                  Manage your travel plans
                </p>
              </div>
            </div>
            <nav className="flex items-center gap-4">
              <Link
                href="/attractions"
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
              >
                <Plane className="mr-2 h-4 w-4" />
                Attractions
              </Link>
              <Link
                href="/trips/new"
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Trip
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <TripsListPage />
      </main>
    </div>
  );
}
