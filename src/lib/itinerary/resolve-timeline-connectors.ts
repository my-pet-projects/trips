import {
  buildFlexibleItineraryTimeline,
  type TimelineOvernightStopLike,
  type TimelinePlanBlockLike,
} from "~/lib/itinerary/build-flexible-itinerary-timeline";
import {
  firstGeocodedRoutePoint,
  lastGeocodedRoutePoint,
  type RoutePoint,
} from "~/lib/itinerary/route-point";

export type GeocodedAttractionLike = {
  id: number;
  latitude: number | null;
  longitude: number | null;
};

export type PlanBlockLike = TimelinePlanBlockLike & {
  attractions: GeocodedAttractionLike[];
};

export type OvernightStopLike = TimelineOvernightStopLike & {
  latitude: number;
  longitude: number;
};

export type ConnectorAttachTo =
  | { type: "plan"; blockId: number; role: "toHotel" | "fromHotel" }
  | { type: "stay"; stopId: number };

export type TimelineConnectorInput = {
  label: string;
  attachTo: ConnectorAttachTo;
  points: [RoutePoint, RoutePoint];
};

function timelineEndpoint(
  entry:
    | { type: "plan"; block: PlanBlockLike }
    | { type: "stay"; stop: OvernightStopLike },
  side: "start" | "end",
): RoutePoint | null {
  if (entry.type === "stay") {
    return {
      kind: "coordinate",
      lat: entry.stop.latitude,
      lng: entry.stop.longitude,
    };
  }

  return side === "start"
    ? firstGeocodedRoutePoint(entry.block.attractions)
    : lastGeocodedRoutePoint(entry.block.attractions);
}

function connectorMeta(
  current:
    | { type: "plan"; block: PlanBlockLike }
    | { type: "stay"; stop: OvernightStopLike },
  next:
    | { type: "plan"; block: PlanBlockLike }
    | { type: "stay"; stop: OvernightStopLike },
): Pick<TimelineConnectorInput, "label" | "attachTo"> | null {
  if (current.type === "plan" && next.type === "stay") {
    return {
      label: "To hotel",
      attachTo: { type: "plan", blockId: current.block.id, role: "toHotel" },
    };
  }
  if (current.type === "stay" && next.type === "plan") {
    return {
      label: "From hotel",
      attachTo: { type: "plan", blockId: next.block.id, role: "fromHotel" },
    };
  }
  if (current.type === "stay" && next.type === "stay") {
    return {
      label: "From previous hotel",
      attachTo: { type: "stay", stopId: next.stop.id },
    };
  }
  return null;
}

/** Routes between consecutive timeline entries that involve at least one hotel. */
export function resolveTimelineConnectors(
  planBlocks: readonly PlanBlockLike[],
  overnightStops: readonly OvernightStopLike[],
): TimelineConnectorInput[] {
  const timeline = buildFlexibleItineraryTimeline(planBlocks, overnightStops);
  const connectors: TimelineConnectorInput[] = [];

  for (let i = 0; i < timeline.entries.length - 1; i++) {
    const current = timeline.entries[i]!;
    const next = timeline.entries[i + 1]!;
    if (current.type !== "stay" && next.type !== "stay") continue;

    const from = timelineEndpoint(current, "end");
    const to = timelineEndpoint(next, "start");
    const meta = connectorMeta(current, next);
    if (!from || !to || !meta) continue;

    connectors.push({ points: [from, to], ...meta });
  }

  return connectors;
}
