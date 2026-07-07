"use client";

import { Bed, Plus, Trash2 } from "lucide-react";
import {
  type Control,
  type FieldErrors,
  type UseFormRegister,
  useFieldArray,
} from "react-hook-form";

import { Button } from "~/app/_components/ui/button";
import { Input } from "~/app/_components/ui/input";
import { Label } from "~/app/_components/ui/label";
import {
  requiredNumberInput,
  type OvernightStopFormData,
  type TripFormData,
} from "~/server/api/schemas/trip";

type OvernightStopsSectionProps = {
  control: Control<TripFormData>;
  register: UseFormRegister<TripFormData>;
  errors: FieldErrors<TripFormData>;
  tripStartDate: string;
  tripEndDate: string;
  disabled?: boolean;
};

const emptyOvernightStop = (
  tripStartDate: string,
  tripEndDate: string,
): OvernightStopFormData => ({
  name: "",
  address: "",
  latitude: Number.NaN,
  longitude: Number.NaN,
  checkInDate: tripStartDate,
  checkOutDate: tripEndDate,
});

export function OvernightStopsSection({
  control,
  register,
  errors,
  tripStartDate,
  tripEndDate,
  disabled = false,
}: OvernightStopsSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "overnightStops",
  });

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
            <Bed className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Overnight Stops
            </h2>
            <p className="text-sm text-gray-500">
              Hotels and lodging for your trip
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !tripStartDate || !tripEndDate}
          onClick={() =>
            append(emptyOvernightStop(tripStartDate, tripEndDate))
          }
          className="shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add stop
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-sm text-gray-500">
          No overnight stops yet. Add a hotel to record where you are staying.
        </p>
      ) : (
        <div className="space-y-6">
          {errors.overnightStops?.root && (
            <p className="text-sm text-red-600">
              {errors.overnightStops.root.message}
            </p>
          )}
          {errors.overnightStops?.message && (
            <p className="text-sm text-red-600">
              {errors.overnightStops.message}
            </p>
          )}
          {fields.map((field, index) => {
            const stopErrors = errors.overnightStops?.[index];

            return (
              <div
                key={field.id}
                className="rounded-lg border border-gray-100 bg-gray-50/50 p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-medium text-gray-900">
                    Stop {index + 1}
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    onClick={() => remove(index)}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`overnightStops.${index}.name`}>
                      Hotel name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`overnightStops.${index}.name`}
                      {...register(`overnightStops.${index}.name`)}
                      className="mt-1.5 h-11"
                      placeholder="e.g., Hotel Roma"
                      disabled={disabled}
                    />
                    {stopErrors?.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {stopErrors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`overnightStops.${index}.address`}>
                      Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`overnightStops.${index}.address`}
                      {...register(`overnightStops.${index}.address`)}
                      className="mt-1.5 h-11"
                      placeholder="Street, city, country"
                      disabled={disabled}
                    />
                    {stopErrors?.address && (
                      <p className="mt-1 text-sm text-red-600">
                        {stopErrors.address.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor={`overnightStops.${index}.checkInDate`}>
                        Check-in <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`overnightStops.${index}.checkInDate`}
                        type="date"
                        min={tripStartDate || undefined}
                        max={tripEndDate || undefined}
                        {...register(`overnightStops.${index}.checkInDate`)}
                        className="mt-1.5 h-11"
                        disabled={disabled}
                      />
                      {stopErrors?.checkInDate && (
                        <p className="mt-1 text-sm text-red-600">
                          {stopErrors.checkInDate.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`overnightStops.${index}.checkOutDate`}>
                        Check-out <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`overnightStops.${index}.checkOutDate`}
                        type="date"
                        min={tripStartDate || undefined}
                        max={tripEndDate || undefined}
                        {...register(`overnightStops.${index}.checkOutDate`)}
                        className="mt-1.5 h-11"
                        disabled={disabled}
                      />
                      {stopErrors?.checkOutDate && (
                        <p className="mt-1 text-sm text-red-600">
                          {stopErrors.checkOutDate.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor={`overnightStops.${index}.latitude`}>
                        Latitude <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`overnightStops.${index}.latitude`}
                        type="number"
                        step="any"
                        {...register(`overnightStops.${index}.latitude`, {
                          setValueAs: requiredNumberInput,
                        })}
                        className="mt-1.5 h-11 font-mono text-sm"
                        placeholder="41.902782"
                        disabled={disabled}
                      />
                      {stopErrors?.latitude && (
                        <p className="mt-1 text-sm text-red-600">
                          {stopErrors.latitude.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`overnightStops.${index}.longitude`}>
                        Longitude <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`overnightStops.${index}.longitude`}
                        type="number"
                        step="any"
                        {...register(`overnightStops.${index}.longitude`, {
                          setValueAs: requiredNumberInput,
                        })}
                        className="mt-1.5 h-11 font-mono text-sm"
                        placeholder="12.496366"
                        disabled={disabled}
                      />
                      {stopErrors?.longitude && (
                        <p className="mt-1 text-sm text-red-600">
                          {stopErrors.longitude.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
