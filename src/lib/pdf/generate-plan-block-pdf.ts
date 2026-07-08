/**
 * PDF generation for plan blocks.
 * Generates PDF documents with plan block overview and individual attraction pages.
 */

import { jsPDF } from "jspdf";
import { DEFAULT_BLOCK_COLOR } from "~/lib/map/colors";
import type { BasicAttraction, PlanBlock } from "~/types";
import { loadCyrillicFont } from "./pdf-font";
import { PDF_LAYOUT } from "./pdf-types";
import { fetchMapImage, fetchOverviewMap, type MapMarker } from "./static-map";

const {
  MARGIN,
  PAGE_WIDTH,
  PAGE_HEIGHT,
  CONTENT_WIDTH,
  MAP_WIDTH,
  MAP_HEIGHT,
} = PDF_LAYOUT;

/**
 * Downloads a blob as a file
 */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function hasCoordinates(
  attraction: BasicAttraction,
): attraction is BasicAttraction & { latitude: number; longitude: number } {
  return attraction.latitude !== null && attraction.longitude !== null;
}

/**
 * Extracts attractions with valid coordinates as map markers
 */
function extractMarkers(attractions: BasicAttraction[]): MapMarker[] {
  return attractions
    .map((a, i) => ({
      lat: a.latitude,
      lng: a.longitude,
      orderNumber: i + 1,
    }))
    .filter((a): a is MapMarker => a.lat !== null && a.lng !== null);
}

/**
 * Creates a new jsPDF document with optional Cyrillic font support
 */
async function createPdfDocument(): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const fontLoaded = await loadCyrillicFont(doc);
  if (fontLoaded) {
    doc.setFont("Roboto", "normal");
  }

  return doc;
}

/**
 * Renders the plan block cover page with overview map and attractions list
 */
function renderPlanBlockCoverPage(
  doc: jsPDF,
  block: PlanBlock,
  tripName?: string,
  overviewMapImage?: string | null,
  blockColor?: string,
): void {
  const color = blockColor ?? DEFAULT_BLOCK_COLOR;
  let yPosition = MARGIN;

  // Trip name (if provided)
  if (tripName) {
    doc.setFontSize(12);
    doc.setTextColor(128, 128, 128);
    doc.text(tripName, MARGIN, yPosition);
    yPosition += 10;
  }

  // Plan name - large and prominent
  doc.setFontSize(36);
  doc.setTextColor(color);
  doc.text(block.name, MARGIN, yPosition + 15);
  yPosition += 25;

  // Attractions count
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `${block.attractions.length} attraction${block.attractions.length !== 1 ? "s" : ""}`,
    MARGIN,
    yPosition,
  );
  yPosition += 15;

  // Overview map
  if (overviewMapImage) {
    const mapWidth = CONTENT_WIDTH;
    const mapHeight = (mapWidth * 2) / 3; // 3:2 aspect ratio

    try {
      doc.addImage(
        overviewMapImage,
        "PNG",
        MARGIN,
        yPosition,
        mapWidth,
        mapHeight,
      );
      yPosition += mapHeight + 10;
    } catch {
      // Skip if image fails
    }
  }

  // Attractions list - two columns for better space usage
  const lineHeight = 5;
  const columnWidth = CONTENT_WIDTH / 2;
  const maxItemsPerColumn = Math.floor(
    (PAGE_HEIGHT - yPosition - MARGIN - 15) / lineHeight,
  );
  const startY = yPosition;

  block.attractions.forEach((attraction, index) => {
    const column = index < maxItemsPerColumn ? 0 : 1;
    const rowInColumn =
      index < maxItemsPerColumn ? index : index - maxItemsPerColumn;

    // Skip if we've exhausted both columns
    if (column > 1 || (column === 1 && rowInColumn >= maxItemsPerColumn))
      return;

    const xOffset = MARGIN + column * columnWidth;
    const itemY = startY + rowInColumn * lineHeight;

    // Plain number
    doc.setFontSize(9);
    doc.setTextColor(color);
    doc.text(`${index + 1}.`, xOffset, itemY);

    // Attraction name
    doc.setTextColor(50, 50, 50);
    const maxNameLength = column === 1 ? 56 : 28;
    const nameText =
      attraction.name.length > maxNameLength
        ? attraction.name.substring(0, maxNameLength - 3) + "..."
        : attraction.name;
    doc.text(nameText, xOffset + 8, itemY);
  });

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text("Overview", PAGE_WIDTH / 2, PAGE_HEIGHT - 10, { align: "center" });
}

/**
 * Renders a single attraction page
 */
function renderAttractionPage(
  doc: jsPDF,
  attraction: BasicAttraction,
  orderNumber: number,
  block: PlanBlock,
  tripName?: string,
  mapImage?: string | null,
): void {
  let yPosition = MARGIN;

  // Header with trip and plan block info
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  const headerText = tripName ? `${tripName} • ${block.name}` : block.name;
  doc.text(headerText, MARGIN, yPosition);

  // Order number badge on the right
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `${orderNumber} of ${block.attractions.length}`,
    PAGE_WIDTH - MARGIN,
    yPosition,
    { align: "right" },
  );

  yPosition += 8;

  // Attraction name
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  const nameLines = doc.splitTextToSize(attraction.name, CONTENT_WIDTH);
  doc.text(nameLines, MARGIN, yPosition);
  yPosition += nameLines.length * 6.5;

  // Local name if available
  if (attraction.nameLocal && attraction.nameLocal !== attraction.name) {
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    const localNameLines = doc.splitTextToSize(
      attraction.nameLocal,
      CONTENT_WIDTH,
    );
    doc.text(localNameLines, MARGIN, yPosition);
    yPosition += localNameLines.length * 4;
  }

  yPosition += 2;

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, yPosition, PAGE_WIDTH - MARGIN, yPosition);
  yPosition += 6;

  // Map image (if available)
  if (mapImage) {
    try {
      doc.addImage(mapImage, "PNG", MARGIN, yPosition, MAP_WIDTH, MAP_HEIGHT);
      yPosition += MAP_HEIGHT + 6;
    } catch {
      // Skip if image fails to add
    }
  }

  // Coordinates section
  if (hasCoordinates(attraction)) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("Location:", MARGIN, yPosition);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `${attraction.latitude.toFixed(6)}, ${attraction.longitude.toFixed(6)}`,
      MARGIN + 18,
      yPosition,
    );
    yPosition += 5;
  }

  // Google Maps link
  if (hasCoordinates(attraction)) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("Maps:", MARGIN, yPosition);
    doc.setTextColor(59, 130, 246);
    const mapsUrl = `https://www.google.com/maps?q=${attraction.latitude},${attraction.longitude}`;
    doc.textWithLink("Open in Google Maps", MARGIN + 12, yPosition, {
      url: mapsUrl,
    });
    yPosition += 5;
  }

  // Source URL if available
  if (attraction.sourceUrl) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("Source:", MARGIN, yPosition);
    doc.setTextColor(59, 130, 246);
    const displayUrl =
      attraction.sourceUrl.length > 45
        ? attraction.sourceUrl.substring(0, 42) + "..."
        : attraction.sourceUrl;
    doc.textWithLink(displayUrl, MARGIN + 14, yPosition, {
      url: attraction.sourceUrl,
    });
    yPosition += 5;
  }

  yPosition += 3;

  // Description - may span multiple pages
  if (attraction.description) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("Description:", MARGIN, yPosition);
    yPosition += 4;

    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);

    const lineHeight = 4.5;
    const descriptionLines: string[] = doc.splitTextToSize(
      attraction.description,
      CONTENT_WIDTH,
    );

    let lineIndex = 0;
    let pageNumber = 1;

    while (lineIndex < descriptionLines.length) {
      const availableHeight = PAGE_HEIGHT - yPosition - MARGIN - 15;
      const linesPerPage = Math.floor(availableHeight / lineHeight);
      const linesToRender = descriptionLines.slice(
        lineIndex,
        lineIndex + linesPerPage,
      );

      doc.text(linesToRender, MARGIN, yPosition, { lineHeightFactor: 1.3 });
      lineIndex += linesToRender.length;

      // Footer for current page
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      const pageLabel =
        pageNumber === 1
          ? `Page ${orderNumber}`
          : `Page ${orderNumber} (cont.)`;
      doc.text(pageLabel, PAGE_WIDTH / 2, PAGE_HEIGHT - 10, {
        align: "center",
      });

      // If more lines remain, add a new page
      if (lineIndex < descriptionLines.length) {
        doc.addPage();
        pageNumber++;
        yPosition = MARGIN;

        // Continuation header
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text(`${attraction.name} (continued)`, MARGIN, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);
      }
    }
  } else {
    // Footer when no description
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${orderNumber}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 10, {
      align: "center",
    });
  }
}

/**
 * Generates a PDF document for a single plan block.
 * Delegates to generateAllPlansPdf for consistent behavior.
 */
export async function generatePlanBlockPdf(
  block: PlanBlock,
  tripName?: string,
  blockColor?: string,
): Promise<void> {
  const colors = blockColor ? new Map([[block.id, blockColor]]) : undefined;
  return generateAllPlansPdf([block], tripName, colors);
}

/** Progress callback for PDF generation */
export type PdfProgressCallback = (status: string) => void;

/**
 * Generates a single PDF document containing all plan blocks.
 * Each plan starts with a cover page, followed by individual attraction pages.
 */
export async function generateAllPlansPdf(
  blocks: PlanBlock[],
  tripName?: string,
  blockColors?: Map<number, string>,
  onProgress?: PdfProgressCallback,
): Promise<void> {
  const blocksWithAttractions = blocks.filter((b) => b.attractions.length > 0);
  if (blocksWithAttractions.length === 0) {
    throw new Error("No attractions to export");
  }

  const totalAttractions = blocksWithAttractions.reduce(
    (sum, b) => sum + b.attractions.length,
    0,
  );

  onProgress?.("Loading fonts...");
  const doc = await createPdfDocument();

  onProgress?.(`Fetching maps for ${totalAttractions} attractions...`);

  // Pre-fetch all maps in parallel
  const [overviewMaps, allMapImages] = await Promise.all([
    Promise.all(
      blocksWithAttractions.map((block) => {
        const blockColor = blockColors?.get(block.id) ?? DEFAULT_BLOCK_COLOR;
        const markers = extractMarkers(block.attractions);
        return fetchOverviewMap(markers, blockColor);
      }),
    ),
    Promise.all(
      blocksWithAttractions.map((block) => {
        const blockColor = blockColors?.get(block.id) ?? DEFAULT_BLOCK_COLOR;
        return Promise.all(
          block.attractions.map((attraction, index) =>
            hasCoordinates(attraction)
              ? fetchMapImage(
                  attraction.latitude,
                  attraction.longitude,
                  index + 1,
                  blockColor,
                )
              : Promise.resolve(null),
          ),
        );
      }),
    ),
  ]);

  let isFirstPage = true;
  let pagesRendered = 0;
  const totalPages = blocksWithAttractions.length + totalAttractions;

  blocksWithAttractions.forEach((block, blockIndex) => {
    const blockColor = blockColors?.get(block.id) ?? DEFAULT_BLOCK_COLOR;
    const blockMapImages = allMapImages[blockIndex] ?? [];
    const overviewMap = overviewMaps[blockIndex] ?? null;

    if (!isFirstPage) {
      doc.addPage();
    }
    isFirstPage = false;
    pagesRendered++;
    onProgress?.(`Rendering page ${pagesRendered} of ${totalPages}...`);
    renderPlanBlockCoverPage(doc, block, tripName, overviewMap, blockColor);

    block.attractions.forEach((attraction, index) => {
      doc.addPage();
      pagesRendered++;
      onProgress?.(`Rendering page ${pagesRendered} of ${totalPages}...`);
      renderAttractionPage(
        doc,
        attraction,
        index + 1,
        block,
        tripName,
        blockMapImages[index] ?? null,
      );
    });
  });

  onProgress?.("Generating PDF file...");

  const fileName =
    blocksWithAttractions.length === 1
      ? `${blocksWithAttractions[0]!.name.replace(/\s+/g, "_")}_itinerary.pdf`
      : tripName
        ? `${tripName.replace(/\s+/g, "_")}_full_itinerary.pdf`
        : "full_itinerary.pdf";
  const pdfBlob = doc.output("blob");
  downloadBlob(pdfBlob, fileName);
}
