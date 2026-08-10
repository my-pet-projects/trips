import { describe, expect, it } from "vitest";

import { resolveOvernightLegInputs } from "~/lib/itinerary/resolve-overnight-leg-inputs";

const d = (iso: string) => new Date(iso);

const attraction = (
  id: number,
  lat: number | null = 48.1,
  lng: number | null = 11.5,
) => ({ id, latitude: lat, longitude: lng });

const block = (
  id: number,
  start: string,
  end: string,
  attractions: ReturnType<typeof attraction>[],
) => ({
  id,
  blockNumber: id,
  pinnedStartDate: d(start),
  pinnedEndDate: d(end),
  attractions,
});

const stop = (
  id: number,
  checkIn: string,
  checkOut: string,
  latitude = 48.3,
  longitude = 11.7,
) => ({
  id,
  name: `Hotel ${id}`,
  latitude,
  longitude,
  checkInDate: d(checkIn),
  checkOutDate: d(checkOut),
});

describe("resolveOvernightLegInputs", () => {
  it("creates arrival leg when a plan is followed by a stay", () => {
    const inputs = resolveOvernightLegInputs(
      [
        block(1, "2026-06-01", "2026-06-01", [
          attraction(10),
          attraction(11, 48.2, 11.6),
        ]),
      ],
      [stop(100, "2026-06-01", "2026-06-02")],
    );

    expect(inputs).toHaveLength(1);
    expect(inputs[0]).toMatchObject({
      blockId: 1,
      kind: "arrival",
      stopId: 100,
      attractionId: 11,
      points: [
        { kind: "attraction", id: 11, lat: 48.2, lng: 11.6 },
        { kind: "coordinate", lat: 48.3, lng: 11.7 },
      ],
    });
  });

  it("creates departure leg when a stay is followed by a plan", () => {
    const inputs = resolveOvernightLegInputs(
      [block(2, "2026-06-02", "2026-06-02", [attraction(20, 47.5, 11.0)])],
      [stop(200, "2026-06-01", "2026-06-02", 47.4, 10.9)],
    );

    expect(inputs).toHaveLength(1);
    expect(inputs[0]).toMatchObject({
      blockId: 2,
      kind: "departure",
      stopId: 200,
      attractionId: 20,
      points: [
        { kind: "coordinate", lat: 47.4, lng: 10.9 },
        { kind: "attraction", id: 20, lat: 47.5, lng: 11.0 },
      ],
    });
  });

  it("creates both legs for a stay sandwiched between two dated plans", () => {
    const inputs = resolveOvernightLegInputs(
      [
        block(1, "2026-06-01", "2026-06-01", [attraction(10)]),
        block(2, "2026-06-03", "2026-06-03", [attraction(20, 50.1, 8.6)]),
      ],
      [stop(300, "2026-06-01", "2026-06-03", 49.0, 12.0)],
    );

    expect(inputs).toHaveLength(2);
    expect(inputs.map((i) => i.kind).sort()).toEqual(["arrival", "departure"]);
  });

  it("skips legs when attractions lack coordinates", () => {
    const inputs = resolveOvernightLegInputs(
      [block(1, "2026-06-01", "2026-06-01", [attraction(10, null, null)])],
      [stop(100, "2026-06-01", "2026-06-02")],
    );

    expect(inputs).toHaveLength(0);
  });

  it("ignores undated plan blocks", () => {
    const inputs = resolveOvernightLegInputs(
      [
        {
          id: 1,
          blockNumber: 1,
          pinnedStartDate: null,
          pinnedEndDate: null,
          attractions: [attraction(10)],
        },
      ],
      [stop(100, "2026-06-01", "2026-06-02")],
    );

    expect(inputs).toHaveLength(0);
  });
});
