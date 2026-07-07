"use client";

import { Bed, ChevronDown, Plus, Trash2 } from "lucide-react";
import {
  type Control,
  type FieldErrors,
  type UseFormRegister,
  useFieldArray,
  useWatch,
} from "react-hook-form";

import { Button } from "~/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/app/_components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/app/_components/ui/collapsible";
import { FormError, FormField } from "~/app/_components/ui/field";
import { Input } from "~/app/_components/ui/input";
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

  const overnightStops = useWatch({ control, name: "overnightStops" });

  return (
    <Card className="border border-gray-200 bg-white shadow-sm ring-0">
      <CardHeader className="border-b pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
              <Bed className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900">
                Overnight Stops
              </CardTitle>
              <CardDescription>
                Hotels and lodging for your trip
              </CardDescription>
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
      </CardHeader>

      <CardContent className="pt-6">
      {fields.length === 0 ? (
        <p className="text-sm text-gray-500">
          No overnight stops yet. Add a hotel to record where you are staying.
        </p>
      ) : (
        <div className="space-y-4">
          {errors.overnightStops?.root?.message && (
            <FormError>{errors.overnightStops.root.message}</FormError>
          )}
          {typeof errors.overnightStops?.message === "string" && (
            <FormError>{errors.overnightStops.message}</FormError>
          )}
          {fields.map((field, index) => {
            const stopErrors = errors.overnightStops?.[index];
            const stopName = overnightStops?.[index]?.name?.trim();

            return (
              <Collapsible
                key={field.id}
                defaultOpen
                className="rounded-lg border border-gray-100 bg-gray-50/50"
              >
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 transition-transform data-open:rotate-180" />
                    <h3 className="truncate text-sm font-medium text-gray-900">
                      Stop {index + 1}
                      {stopName ? (
                        <span className="font-normal text-gray-500">
                          {" "}
                          — {stopName}
                        </span>
                      ) : null}
                    </h3>
                  </CollapsibleTrigger>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    onClick={() => remove(index)}
                    className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>

                <CollapsibleContent className="px-4 pb-4">
                  <div className="space-y-4 border-t border-gray-100 pt-4">
                    <FormField
                      label={
                        <>
                          Hotel name <span className="text-red-500">*</span>
                        </>
                      }
                      htmlFor={`overnightStops.${index}.name`}
                      error={stopErrors?.name?.message}
                    >
                      <Input
                        id={`overnightStops.${index}.name`}
                        {...register(`overnightStops.${index}.name`)}
                        className="h-11"
                        placeholder="e.g., Hotel Roma"
                        disabled={disabled}
                      />
                    </FormField>

                    <FormField
                      label={
                        <>
                          Address <span className="text-red-500">*</span>
                        </>
                      }
                      htmlFor={`overnightStops.${index}.address`}
                      error={stopErrors?.address?.message}
                    >
                      <Input
                        id={`overnightStops.${index}.address`}
                        {...register(`overnightStops.${index}.address`)}
                        className="h-11"
                        placeholder="Street, city, country"
                        disabled={disabled}
                      />
                    </FormField>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        label={
                          <>
                            Check-in <span className="text-red-500">*</span>
                          </>
                        }
                        htmlFor={`overnightStops.${index}.checkInDate`}
                        error={stopErrors?.checkInDate?.message}
                      >
                        <Input
                          id={`overnightStops.${index}.checkInDate`}
                          type="date"
                          min={tripStartDate || undefined}
                          max={tripEndDate || undefined}
                          {...register(`overnightStops.${index}.checkInDate`)}
                          className="h-11"
                          disabled={disabled}
                        />
                      </FormField>

                      <FormField
                        label={
                          <>
                            Check-out <span className="text-red-500">*</span>
                          </>
                        }
                        htmlFor={`overnightStops.${index}.checkOutDate`}
                        error={stopErrors?.checkOutDate?.message}
                      >
                        <Input
                          id={`overnightStops.${index}.checkOutDate`}
                          type="date"
                          min={tripStartDate || undefined}
                          max={tripEndDate || undefined}
                          {...register(`overnightStops.${index}.checkOutDate`)}
                          className="h-11"
                          disabled={disabled}
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        label={
                          <>
                            Latitude <span className="text-red-500">*</span>
                          </>
                        }
                        htmlFor={`overnightStops.${index}.latitude`}
                        error={stopErrors?.latitude?.message}
                      >
                        <Input
                          id={`overnightStops.${index}.latitude`}
                          type="number"
                          step="any"
                          {...register(`overnightStops.${index}.latitude`, {
                            setValueAs: requiredNumberInput,
                          })}
                          className="h-11 font-mono text-sm"
                          placeholder="41.902782"
                          disabled={disabled}
                        />
                      </FormField>

                      <FormField
                        label={
                          <>
                            Longitude <span className="text-red-500">*</span>
                          </>
                        }
                        htmlFor={`overnightStops.${index}.longitude`}
                        error={stopErrors?.longitude?.message}
                      >
                        <Input
                          id={`overnightStops.${index}.longitude`}
                          type="number"
                          step="any"
                          {...register(`overnightStops.${index}.longitude`, {
                            setValueAs: requiredNumberInput,
                          })}
                          className="h-11 font-mono text-sm"
                          placeholder="12.496366"
                          disabled={disabled}
                        />
                      </FormField>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}
      </CardContent>
    </Card>
  );
}
