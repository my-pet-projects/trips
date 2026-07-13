import { Bed, CalendarDays, Clock3 } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "~/app/_components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/app/_components/ui/card";
import { buildFlexibleItineraryTimeline } from "~/lib/itinerary/build-flexible-itinerary-timeline";
import { formatItineraryDateRange } from "~/lib/itinerary/format-itinerary-date";
import type { OvernightStop, PlanBlock } from "~/types";

type ItineraryTimelineProps = {
  planBlocks: PlanBlock[];
  overnightStops: OvernightStop[];
  renderBlock: (block: PlanBlock) => ReactNode;
};

export function ItineraryTimeline({
  planBlocks,
  overnightStops,
  renderBlock,
}: ItineraryTimelineProps) {
  const timeline = buildFlexibleItineraryTimeline(planBlocks, overnightStops);

  return (
    <section
      className="space-y-4"
      aria-label="Plans and overnight stays timeline"
      data-testid="itinerary-flexible-timeline"
    >
      {timeline.entries.length > 0 && (
        <div className="relative space-y-4 before:absolute before:top-4 before:bottom-4 before:left-4 before:w-px before:bg-gray-200">
          {timeline.entries.map((entry) =>
            entry.type === "stay" ? (
              <div
                key={`stay-${entry.stop.id}`}
                className="relative grid grid-cols-[2rem_minmax(0,1fr)] gap-3"
                data-testid="itinerary-stay-anchor"
              >
                <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-indigo-600 text-white shadow-sm">
                  <Bed className="h-3.5 w-3.5" />
                </div>
                <Card
                  size="sm"
                  className="gap-2 bg-indigo-50/70 ring-indigo-200"
                >
                  <CardHeader>
                    <CardTitle className="truncate">
                      {entry.stop.name}
                    </CardTitle>
                    <CardDescription className="truncate text-xs">
                      {entry.stop.address}
                    </CardDescription>
                    <CardAction>
                      <Badge
                        variant="outline"
                        className="shrink-0 border-indigo-200 bg-white text-indigo-700"
                      >
                        Stay
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="flex items-center gap-2 text-xs text-indigo-800">
                    <span>
                      Check in{" "}
                      <strong className="font-semibold">
                        {formatItineraryDateRange(
                          entry.startDate,
                          entry.startDate,
                        )}
                      </strong>
                    </span>
                    <span aria-hidden="true">→</span>
                    <span>
                      Check out{" "}
                      <strong className="font-semibold">
                        {formatItineraryDateRange(entry.endDate, entry.endDate)}
                      </strong>
                    </span>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div
                key={`plan-${entry.block.id}`}
                className="relative grid grid-cols-[2rem_minmax(0,1fr)] gap-3"
              >
                <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-sky-100 text-sky-700 shadow-sm">
                  <CalendarDays className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">{renderBlock(entry.block)}</div>
              </div>
            ),
          )}
        </div>
      )}

      {timeline.undatedBlocks.length > 0 && (
        <Card
          size="sm"
          className="gap-3 border border-dashed border-gray-300 bg-gray-50/70 ring-0"
        >
          <CardHeader>
            <div className="flex items-start gap-2">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
              <div>
                <CardTitle>Any time during trip</CardTitle>
                <CardDescription className="text-xs leading-5">
                  These attraction blocks have no date range yet.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {timeline.undatedBlocks.map((block) => renderBlock(block))}
          </CardContent>
        </Card>
      )}
    </section>
  );
}
