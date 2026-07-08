"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Plus, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { CountryCombobox } from "~/app/_components/geo/country-combobox";
import { Button } from "~/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/app/_components/ui/card";
import { FormField } from "~/app/_components/ui/field";
import { Input } from "~/app/_components/ui/input";
import { Separator } from "~/app/_components/ui/separator";
import { Spinner } from "~/app/_components/ui/spinner";
import {
  applyTrpcZodErrorsToForm,
  getTrpcFormErrorDescription,
} from "~/lib/trpc-error-message";
import { formatDateForInput } from "~/lib/format-date-for-input";
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
        <Card className="border border-gray-200 bg-white shadow-sm ring-0">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100">
                <Calendar className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900">
                  Trip Details
                </CardTitle>
                <CardDescription>
                  Basic information about your travel plans
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-6">
            <FormField
              label={
                <>
                  Trip Name <span className="text-red-500">*</span>
                </>
              }
              htmlFor="name"
              error={errors.name?.message}
            >
              <Input
                id="name"
                {...register("name")}
                className="h-12"
                placeholder="e.g., European Backpacking Adventure"
                disabled={isSubmitting}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField
                label={
                  <>
                    Start Date <span className="text-red-500">*</span>
                  </>
                }
                htmlFor="startDate"
                error={errors.startDate?.message}
              >
                <Input
                  id="startDate"
                  type="date"
                  {...register("startDate")}
                  className="h-12"
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField
                label={
                  <>
                    End Date <span className="text-red-500">*</span>
                  </>
                }
                htmlFor="endDate"
                error={errors.endDate?.message}
              >
                <Input
                  id="endDate"
                  type="date"
                  {...register("endDate")}
                  className="h-12"
                  disabled={isSubmitting}
                />
              </FormField>
            </div>

            <FormField
              label={
                <>
                  Destinations <span className="text-red-500">*</span>
                </>
              }
              htmlFor="country-select-multi"
              error={
                countriesError
                  ? "Failed to load countries. Please refresh the page and try again."
                  : errors.destinations?.message
              }
            >
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
            </FormField>
          </CardContent>
        </Card>

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

        <Separator />

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="h-10 px-5"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !!countriesError}
            className="h-10 bg-orange-500 px-5 hover:bg-orange-600"
          >
            {isSubmitting ? (
              <>
                <Spinner className="mr-2" />
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
