import { z } from "zod";

import { nullableNumberInput } from "~/lib/validators/attraction";

export const overnightStopInputSchema = z.object({
  name: z.string().min(1, "Hotel name is required").max(256).trim(),
  address: z.string().min(1, "Address is required").trim(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  checkInDate: z.date(),
  checkOutDate: z.date(),
});

export type OvernightStopInput = z.infer<typeof overnightStopInputSchema>;

export const overnightStopFormSchema = z.object({
  name: z.string().min(1, "Hotel name is required").max(256),
  address: z.string().min(1, "Address is required"),
  latitude: z
    .number({ error: "Latitude is required" })
    .min(-90)
    .max(90),
  longitude: z
    .number({ error: "Longitude is required" })
    .min(-180)
    .max(180),
  checkInDate: z.string().min(1, "Check-in date is required"),
  checkOutDate: z.string().min(1, "Check-out date is required"),
});

export type OvernightStopFormData = z.infer<typeof overnightStopFormSchema>;

export const requiredNumberInput = (value: unknown): number =>
  nullableNumberInput(value) ?? Number.NaN;

type OvernightStopDates = {
  checkInDate: Date | string;
  checkOutDate: Date | string;
};

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function validateOvernightStopsWithinTrip(
  overnightStops: OvernightStopDates[],
  tripStartDate: Date | string,
  tripEndDate: Date | string,
  ctx: z.core.$RefinementCtx,
): void {
  const tripStart = toDate(tripStartDate);
  const tripEnd = toDate(tripEndDate);

  overnightStops.forEach((stop, index) => {
    const checkIn = toDate(stop.checkInDate);
    const checkOut = toDate(stop.checkOutDate);
    const checkInValid = !isNaN(checkIn.getTime());
    const checkOutValid = !isNaN(checkOut.getTime());

    if (checkInValid && checkOutValid && checkIn >= checkOut) {
      ctx.addIssue({
        code: "custom",
        message: "Check-out must be after check-in",
        path: ["overnightStops", index, "checkOutDate"],
      });
    }

    if (checkInValid && checkIn < tripStart) {
      ctx.addIssue({
        code: "custom",
        message: "Check-in must be on or after the trip start date",
        path: ["overnightStops", index, "checkInDate"],
      });
    }

    if (checkOutValid && checkOut > tripEnd) {
      ctx.addIssue({
        code: "custom",
        message: "Check-out must be on or before the trip end date",
        path: ["overnightStops", index, "checkOutDate"],
      });
    }
  });
}

export const tripCoreSchema = z.object({
  name: z.string().min(1, "Name is required").max(256),
  startDate: z.date(),
  endDate: z.date(),
  destinations: z
    .array(
      z.object({
        countryCode: z.string().length(2),
      }),
    )
    .min(1, "At least one destination is required"),
});

export const tripCreateSchema = tripCoreSchema.refine(
  (data) => data.startDate <= data.endDate,
  {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
  },
);

export const tripUpdateSchema = z
  .object({
    id: z.number(),
    overnightStops: z.array(overnightStopInputSchema).default([]),
  })
  .merge(tripCoreSchema)
  .refine((data) => data.startDate <= data.endDate, {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
  })
  .superRefine((data, ctx) => {
    validateOvernightStopsWithinTrip(
      data.overnightStops,
      data.startDate,
      data.endDate,
      ctx,
    );
  });

const tripDateRefinement = (data: { startDate: string; endDate: string }) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end;
};

export const tripFormSchema = z
  .object({
    name: z.string().min(1, "Trip name is required").max(256),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    destinations: z
      .array(z.object({ countryCode: z.string() }))
      .min(1, "At least one destination is required"),
    overnightStops: z.array(overnightStopFormSchema),
  })
  .refine(tripDateRefinement, {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
  })
  .superRefine((data, ctx) => {
    validateOvernightStopsWithinTrip(
      data.overnightStops,
      data.startDate,
      data.endDate,
      ctx,
    );
  });

export type TripFormData = z.infer<typeof tripFormSchema>;
