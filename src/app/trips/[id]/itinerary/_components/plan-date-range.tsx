"use client";

import { Calendar, X } from "lucide-react";

import { Input } from "~/app/_components/ui/input";
import { Label } from "~/app/_components/ui/label";
import { formatDateForInput } from "~/lib/format-date-for-input";
import {
  formatItineraryDateRange,
  parseDateInput,
} from "~/lib/itinerary/format-itinerary-date";
import {
  resolvePlanDateRange,
  type PlanDateRangeFields,
} from "~/server/api/schemas/itinerary";

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
  const resolvedRange = resolvePlanDateRange(value);
  const hasRange =
    value.pinnedStartDate !== null || value.pinnedEndDate !== null;

  const handleStartChange = (input: string) => {
    onChange({
      ...value,
      pinnedStartDate: parseDateInput(input),
    });
  };

  const handleEndChange = (input: string) => {
    onChange({
      ...value,
      pinnedEndDate: parseDateInput(input),
    });
  };

  const handleClear = () => {
    onChange({
      pinnedStartDate: null,
      pinnedEndDate: null,
    });
  };

  return (
    <div
      className="mx-1 my-4 space-y-3 border-t border-gray-100 px-1 pt-4 pb-2"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
          <Calendar className="h-3.5 w-3.5" />
          When
        </div>
        {hasRange && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {resolvedRange && (
        <p className="text-xs text-indigo-700">
          {formatItineraryDateRange(
            resolvedRange.startDate,
            resolvedRange.endDate,
          )}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">From</Label>
          <Input
            type="date"
            min={tripStart}
            max={tripEnd}
            value={formatDateForInput(value.pinnedStartDate)}
            onChange={(event) => handleStartChange(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">To</Label>
          <Input
            type="date"
            min={pinnedStart || tripStart}
            max={tripEnd}
            value={formatDateForInput(value.pinnedEndDate)}
            onChange={(event) => handleEndChange(event.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
