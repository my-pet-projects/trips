"use client";

import { Calendar, X } from "lucide-react";

import { Button } from "~/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/app/_components/ui/card";
import { Field, FieldLabel } from "~/app/_components/ui/field";
import { Input } from "~/app/_components/ui/input";
import { formatDateForInput } from "~/lib/format-date-for-input";
import { parseDateInput } from "~/lib/itinerary/format-itinerary-date";
import type { PlanDateRangeFields } from "~/server/api/schemas/itinerary";

type PlanDateRangeProps = {
  value: PlanDateRangeFields;
  tripStartDate: Date;
  tripEndDate: Date;
  onChange: (value: PlanDateRangeFields) => void;
};

export function PlanDateRange({
  value,
  tripStartDate,
  tripEndDate,
  onChange,
}: PlanDateRangeProps) {
  const tripStart = formatDateForInput(tripStartDate);
  const tripEnd = formatDateForInput(tripEndDate);
  const pinnedStart = formatDateForInput(value.pinnedStartDate);
  const hasRange = value.pinnedStartDate !== null;

  const handleStartChange = (input: string) => {
    const nextStartDate = parseDateInput(input);
    onChange({
      ...value,
      pinnedStartDate: nextStartDate,
      pinnedEndDate: !nextStartDate
        ? null
        : value.pinnedEndDate && nextStartDate > value.pinnedEndDate
          ? nextStartDate
          : value.pinnedEndDate,
    });
  };

  const handleEndChange = (input: string) => {
    if (!value.pinnedStartDate) return;
    const nextEndDate = parseDateInput(input);
    onChange({
      ...value,
      pinnedEndDate:
        nextEndDate && nextEndDate < value.pinnedStartDate
          ? value.pinnedStartDate
          : nextEndDate,
    });
  };

  const handleClear = () => {
    onChange({
      pinnedStartDate: null,
      pinnedEndDate: null,
    });
  };

  return (
    <Card
      size="sm"
      className="my-4 gap-3 bg-sky-50/50 ring-sky-100"
      onClick={(event) => event.stopPropagation()}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-sky-600" />
          Date range
        </CardTitle>
        <CardDescription className="text-xs leading-5">
          Used only to position this block in the trip; attractions are not
          scheduled to a specific day.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel className="text-xs">Start date</FieldLabel>
          <Input
            type="date"
            min={tripStart}
            max={tripEnd}
            value={formatDateForInput(value.pinnedStartDate)}
            onChange={(event) => handleStartChange(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel className="text-xs">End date</FieldLabel>
          <Input
            type="date"
            min={pinnedStart || tripStart}
            max={tripEnd}
            disabled={!value.pinnedStartDate}
            value={formatDateForInput(value.pinnedEndDate)}
            onChange={(event) => handleEndChange(event.target.value)}
          />
        </Field>
      </CardContent>
      <CardFooter className="flex-wrap justify-between gap-2 bg-sky-50/40 py-2">
        <p className="text-xs leading-5 text-gray-500">
          No dates keeps this block under “Any time during trip.”
        </p>
        {hasRange && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-7 shrink-0 gap-1 px-2 text-xs text-gray-600 hover:bg-white hover:text-gray-900"
          >
            <X className="h-3 w-3" />
            Remove dates
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
