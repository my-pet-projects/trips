"use client";

import { FileDown, Loader2 } from "lucide-react";
import { useCallback } from "react";

import { generateAllDaysPdf, generateDayPdf } from "~/lib/pdf";
import { usePdfGeneration } from "~/lib/pdf/use-pdf-generation";
import type { ItineraryDayData } from "~/types";

type ItineraryAllDaysPdfButtonProps = {
  days: ItineraryDayData[];
  tripName: string;
  dayColors: Map<number, string>;
  disabled?: boolean;
};

export function ItineraryAllDaysPdfButton({
  days,
  tripName,
  dayColors,
  disabled = false,
}: ItineraryAllDaysPdfButtonProps) {
  const { isGenerating, generate } = usePdfGeneration();

  const handleClick = useCallback(() => {
    void generate(
      (onProgress) => generateAllDaysPdf(days, tripName, dayColors, onProgress),
      {
        loadingMessage: "Starting PDF generation...",
        successDescription: "Full itinerary has been saved.",
      },
    );
  }, [days, tripName, dayColors, generate]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isGenerating}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      title="Download all days as PDF"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      {isGenerating ? "Generating..." : "Generate PDF"}
    </button>
  );
}

type ItineraryDayPdfButtonProps = {
  day: ItineraryDayData;
  color: string;
  disabled?: boolean;
};

export function ItineraryDayPdfButton({
  day,
  color,
  disabled = false,
}: ItineraryDayPdfButtonProps) {
  const { isGenerating, generate } = usePdfGeneration();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      void generate(
        () => generateDayPdf(day, undefined, color),
        { successDescription: `${day.name} itinerary has been saved.` },
      );
    },
    [day, color, generate],
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isGenerating}
      className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-sky-50 hover:text-sky-600 hover:shadow-sm active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      title="Download PDF"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
    </button>
  );
}
