"use client";

import { TRPCClientError } from "@trpc/client";
import {
  AlertCircle,
  Calendar,
  Loader2,
  MapPin,
  MoreVertical,
  Pencil,
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

interface TripWithParsedDates extends Trip {
  parsedStartDate: Date;
  parsedEndDate: Date;
}

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
  const now = Date.now();
  const start = startDate.getTime();
  const end = endDate.getTime();

  if (now < start) {
    return { label: "Upcoming", color: "bg-blue-100 text-blue-700" };
  } else if (now > end) {
    return { label: "Completed", color: "bg-gray-100 text-gray-700" };
  } else {
    return { label: "In Progress", color: "bg-green-100 text-green-700" };
  }
};

function TripCard({
  trip,
  onDelete,
}: {
  trip: TripWithParsedDates;
  onDelete: (id: number) => void;
}) {
  const { id, name, parsedStartDate, parsedEndDate, destinations } = trip;
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
                    {dest.country.name}
                  </div>
                ))}
                {destinations.length > 5 && (
                  <div
                    className="rounded-md bg-gray-100 px-3 py-1 text-sm text-gray-500"
                    title={destinations
                      .slice(5)
                      .map((d) => d.country.name)
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
              className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
              onPointerDown={(e) => e.stopPropagation()}
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
                e.stopPropagation();
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

function ErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-red-200 bg-red-50">
      <div className="text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          Failed to load trips
        </h3>
        <p className="mt-2 text-sm text-gray-600">{getErrorMessage(error)}</p>
        <Button
          onClick={onRetry}
          className="mt-6 bg-orange-500 hover:bg-orange-600"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}

export function TripsList() {
  const utils = api.useUtils();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<number | null>(null);

  const {
    data: trips,
    isLoading,
    error,
    refetch,
  } = api.trip.listTrips.useQuery();

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

  const tripsWithParsedDates = useMemo(() => {
    return (
      trips?.map((trip) => ({
        ...trip,
        parsedStartDate: new Date(trip.startDate),
        parsedEndDate: new Date(trip.endDate),
      })) ?? []
    );
  }, [trips]);

  const { upcomingTrips, activeTrips, pastTrips } = useMemo(() => {
    const now = Date.now();
    const upcoming: TripWithParsedDates[] = [];
    const active: TripWithParsedDates[] = [];
    const past: TripWithParsedDates[] = [];

    tripsWithParsedDates.forEach((trip) => {
      const start = trip.parsedStartDate.getTime();
      const end = trip.parsedEndDate.getTime();

      if (now < start) {
        upcoming.push(trip);
      } else if (now > end) {
        past.push(trip);
      } else {
        active.push(trip);
      }
    });

    return { upcomingTrips: upcoming, activeTrips: active, pastTrips: past };
  }, [tripsWithParsedDates]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-3xl font-bold">All Trips</h2>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : !tripsWithParsedDates || tripsWithParsedDates.length === 0 ? (
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
              undone and will remove all associated destinations.
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
