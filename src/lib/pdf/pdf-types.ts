/**
 * Shared types for PDF generation.
 */

export type BasicAttraction = {
  id: number;
  name: string;
  nameLocal: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  sourceUrl: string | null;
  countryCode: string;
  cityId: number;
};

export type ItineraryDayData = {
  id: number;
  name: string;
  dayNumber: number;
  attractions: BasicAttraction[];
};

/** PDF layout constants */
export const PDF_LAYOUT = {
  MARGIN: 20,
  PAGE_WIDTH: 210, // A4 width in mm
  PAGE_HEIGHT: 297, // A4 height in mm
  CONTENT_WIDTH: 210 - 2 * 20, // PAGE_WIDTH - 2 * MARGIN
  MAP_WIDTH: 80, // mm
  MAP_HEIGHT: 60, // mm
} as const;
