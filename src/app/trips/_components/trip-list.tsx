"use client";

import { TRPCClientError } from "@trpc/client";
import {
  AlertCircle,
  Calendar,
  Clock,
  Eye,
  History,
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
import { getFlagEmoji } from "~/lib/utils";
import { api } from "~/trpc/react";
import type { TripListItem } from "~/types";

interface TripWithParsedDates extends TripListItem {
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

type TripStatusKey = "upcoming" | "active" | "completed";

const getTripStatus = (
  startDate: Date,
  endDate: Date,
): {
  key: TripStatusKey;
  label: string;
  badgeColor: string;
  headerGradient: string;
} => {
  const now = Date.now();
  const start = startDate.getTime();
  const end = endDate.getTime();

  if (now < start) {
    return {
      key: "upcoming",
      label: "Upcoming",
      badgeColor: "bg-blue-100 text-blue-700",
      headerGradient: "bg-linear-to-br from-sky-50 to-indigo-50",
    };
  } else if (now > end) {
    return {
      key: "completed",
      label: "Completed",
      badgeColor: "bg-gray-100 text-gray-700",
      headerGradient: "bg-linear-to-br from-slate-50 to-gray-100",
    };
  } else {
    return {
      key: "active",
      label: "In Progress",
      badgeColor: "bg-green-100 text-green-700",
      headerGradient: "bg-linear-to-br from-emerald-50 to-teal-50",
    };
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
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-gray-300">
      {/* Header */}
      <div className={`px-5 py-4 ${status.headerGradient}`}>
        {/* Trip name */}
        <h3 className="line-clamp-2 text-lg font-semibold text-gray-900 transition-colors group-hover:text-gray-700">
          {name}
        </h3>
      </div>

      <Link href={`/trips/${id}`} className="block">
        <div className="px-5 py-4">
          {/* Date with icon */}
          <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>{formatDateRange(parsedStartDate, parsedEndDate)}</span>
          </div>

          {/* Countries list */}
          {destinations.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {destinations.slice(0, 3).map((dest) => (
                <div
                  key={dest.id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                >
                  <span className="text-sm">
                    {getFlagEmoji(dest.country.cca2)}
                  </span>
                  {dest.country.name}
                </div>
              ))}
              {destinations.length > 3 && (
                <div
                  className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500"
                  title={destinations
                    .slice(3)
                    .map((d) => d.country.name)
                    .join(", ")}
                >
                  +{destinations.length - 3} more
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Plane className="h-4 w-4" />
              <span>Plan your destinations</span>
            </div>
          )}
        </div>
      </Link>

      {/* Actions Menu */}
      <div className="absolute top-3 right-3">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg bg-white/80 shadow-sm backdrop-blur-sm transition-all md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
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
            <DropdownMenuItem asChild>
              <Link
                href={`/trips/${id}/itinerary`}
                className="flex items-center"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Itinerary
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/trips/${id}/view`} className="flex items-center">
                <Eye className="mr-2 h-4 w-4" />
                View
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
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 shadow-sm">
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No trips yet
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Start your adventure by creating your first trip.
          </p>
          <Button asChild className="mt-6 bg-sky-500 hover:bg-sky-600">
            <Link href="/trips/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Trip
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-gray-400" />
          <p className="mt-4 text-gray-600">Loading trips...</p>
        </div>
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
    <div className="rounded-lg border border-red-200 bg-red-50 p-8 shadow-sm">
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            Failed to load trips
          </h3>
          <p className="mt-2 text-sm text-gray-600">{getErrorMessage(error)}</p>
          <Button
            onClick={onRetry}
            className="mt-6 bg-sky-500 hover:bg-sky-600"
          >
            Try Again
          </Button>
        </div>
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
    <div>
      {/* Content */}
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : !tripsWithParsedDates || tripsWithParsedDates.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-10">
          {/* Active Trips */}
          {activeTrips.length > 0 && (
            <section>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                  <Plane className="h-4 w-4 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Active Trips
                </h2>
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  {activeTrips.length}
                </span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {activeTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming Trips */}
          {upcomingTrips.length > 0 && (
            <section>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Upcoming Trips
                </h2>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  {upcomingTrips.length}
                </span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {upcomingTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Past Trips */}
          {pastTrips.length > 0 && (
            <section>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                  <History className="h-4 w-4 text-gray-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Past Trips
                </h2>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                  {pastTrips.length}
                </span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pastTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            </section>
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
