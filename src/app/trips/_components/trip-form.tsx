"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Loader2, Plus, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { CountryCombobox } from "~/app/_components/geo/country-combobox";
import { Button } from "~/app/_components/ui/button";
import { Input } from "~/app/_components/ui/input";
import { Label } from "~/app/_components/ui/label";
import {
  applyTrpcZodErrorsToForm,
  getTrpcFormErrorDescription,
} from "~/lib/trpc-error-message";
import { tripFormSchema, type TripFormData } from "~/server/api/schemas/trip";
import { api } from "~/trpc/react";
import type { Country, TripById } from "~/types";

import { OvernightStopsSection } from "./overnight-stops-section";

type TripFormProps =
  | {
      mode: "create";
      trip?: never;
    }
  | {
      mode: "edit";
      trip: TripById;
    };

const formatDateForInput = (date: Date | string | null | undefined): string => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0] ?? "";
};

export function TripForm({ mode, trip }: TripFormProps) {
  const router = useRouter();
  const utils = api.useUtils();

  const { data: countries, isLoading: isLoadingCountries, error: countriesError } =
    api.geo.getCountries.useQuery();

  const countryOptions = useMemo(
    () =>
      countries?.map((c) => ({
        value: c.cca2,
        label: c.name,
        fullCountry: c,
      })) ?? [],
    [countries],
  );

  const isEditMode = mode === "edit";

  const form = useForm<TripFormData>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      name: "",
      startDate: "",
      endDate: "",
      destinations: [],
      overnightStops: [],
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    setError,
    watch,
    reset,
  } = form;

  const selectedDestinations = watch("destinations");
  const tripStartDate = watch("startDate");
  const tripEndDate = watch("endDate");

  useEffect(() => {
    if (isEditMode && trip) {
      reset({
        name: trip.name,
        startDate: formatDateForInput(trip.startDate),
        endDate: formatDateForInput(trip.endDate),
        destinations: trip.destinations.map((d) => ({
          countryCode: d.countryCode,
        })),
        overnightStops: trip.overnightStops.map((stop) => ({
          name: stop.name,
          address: stop.address,
          latitude: stop.latitude,
          longitude: stop.longitude,
          checkInDate: formatDateForInput(stop.checkInDate),
          checkOutDate: formatDateForInput(stop.checkOutDate),
        })),
      });
    }
  }, [isEditMode, trip, reset]);

  const selectedCountries = useMemo(() => {
    if (!countries) return [];
    return countries.filter((c) =>
      selectedDestinations.some((d) => d.countryCode === c.cca2),
    );
  }, [countries, selectedDestinations]);

  const handleMutationError = useCallback(
    (title: string, err: unknown) => {
      const fieldsMapped = applyTrpcZodErrorsToForm(err, setError);
      toast.error(title, {
        description: getTrpcFormErrorDescription(err, fieldsMapped),
      });
    },
    [setError],
  );

  const createMutation = api.trip.create.useMutation({
    onSuccess: (data) => {
      toast.success("Trip created!", {
        description: "The trip has been created successfully.",
      });
      void utils.trip.invalidate();
      router.push(`/trips/${data.id}/edit`);
    },
    onError: (err) => {
      handleMutationError("Failed to create trip", err);
    },
  });

  const updateMutation = api.trip.update.useMutation({
    onSuccess: () => {
      toast.success("Trip updated!", {
        description: "Changes have been saved successfully.",
      });
      void utils.trip.invalidate();
    },
    onError: (err) => {
      handleMutationError("Failed to update trip", err);
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: TripFormData) => {
    const payload = {
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      destinations: data.destinations,
    };

    if (isEditMode && trip) {
      updateMutation.mutate({
        id: trip.id,
        ...payload,
        overnightStops: data.overnightStops.map((stop) => ({
          name: stop.name,
          address: stop.address,
          latitude: stop.latitude,
          longitude: stop.longitude,
          checkInDate: new Date(stop.checkInDate),
          checkOutDate: new Date(stop.checkOutDate),
        })),
      });
      return;
    }

    createMutation.mutate(payload);
  };

  const handleCountryChange = (countries: Country[]) => {
    setValue(
      "destinations",
      countries.map((c) => ({ countryCode: c.cca2 })),
      { shouldValidate: true },
    );
  };

  return (
    <div className="mx-auto max-w-4xl">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
        autoComplete="off"
      >
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3 border-b pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100">
              <Calendar className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Trip Details
              </h2>
              <p className="text-sm text-gray-500">
                Basic information about your travel plans
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <Label htmlFor="name">
                Trip Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                className="mt-1.5 h-12"
                placeholder="e.g., European Backpacking Adventure"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="startDate">
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register("startDate")}
                  className="mt-1.5 h-12"
                  disabled={isSubmitting}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="endDate">
                  End Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register("endDate")}
                  className="mt-1.5 h-12"
                  disabled={isSubmitting}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">
                Destinations <span className="text-red-500">*</span>
              </Label>
              {countriesError && (
                <p className="mb-2 text-sm text-red-600">
                  Failed to load countries. Please refresh the page and try
                  again.
                </p>
              )}
              <CountryCombobox
                options={countryOptions}
                isLoading={isLoadingCountries || isSubmitting}
                value={selectedCountries}
                onChange={handleCountryChange}
                multiple={true}
                showLabel={false}
                placeholder={
                  countriesError
                    ? "Countries unavailable"
                    : isLoadingCountries
                      ? "Loading countries..."
                      : "Select countries..."
                }
                disabled={isSubmitting || !!countriesError}
              />
              {errors.destinations && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.destinations.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {isEditMode && (
          <OvernightStopsSection
            control={control}
            register={register}
            errors={errors}
            tripStartDate={tripStartDate}
            tripEndDate={tripEndDate}
            disabled={isSubmitting}
          />
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="h-12 px-6"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !!countriesError}
            className="h-12 bg-orange-500 px-6 hover:bg-orange-600"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? "Saving..." : "Creating..."}
              </>
            ) : (
              <>
                {isEditMode ? (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Trip
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
