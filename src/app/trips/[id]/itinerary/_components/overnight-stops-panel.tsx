import { Bed } from "lucide-react";

import { formatItineraryDateRange } from "~/lib/itinerary/format-itinerary-date";
import type { OvernightStop } from "~/types";

type OvernightStopsPanelProps = {
  overnightStops: OvernightStop[];
};

export function OvernightStopsPanel({
  overnightStops,
}: OvernightStopsPanelProps) {
  return (
    <section className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Bed className="h-4 w-4 text-indigo-600" />
        <h3 className="text-sm font-semibold text-gray-900">Overnight Stays</h3>
      </div>

      {overnightStops.length === 0 ? (
        <p className="text-sm text-gray-600">No overnight stops yet.</p>
      ) : (
        <ul className="space-y-2">
          {overnightStops.map((stop) => (
            <li
              key={stop.id}
              className="rounded-lg border border-indigo-100 bg-white px-3 py-2.5"
            >
              <p className="font-medium text-gray-900">{stop.name}</p>
              <p className="text-xs text-gray-500">
                {formatItineraryDateRange(stop.checkInDate, stop.checkOutDate)}
              </p>
              <p className="truncate text-xs text-gray-600">{stop.address}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
