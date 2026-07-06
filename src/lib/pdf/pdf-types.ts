/**
 * PDF layout constants.
 */

/** PDF layout constants */
export const PDF_LAYOUT = {
  MARGIN: 20,
  PAGE_WIDTH: 210, // A4 width in mm
  PAGE_HEIGHT: 297, // A4 height in mm
  CONTENT_WIDTH: 210 - 2 * 20, // PAGE_WIDTH - 2 * MARGIN
  MAP_WIDTH: 80, // mm
  MAP_HEIGHT: 60, // mm
} as const;
