"use client";

import { FileDown } from "lucide-react";
import { useCallback } from "react";

import { Button } from "~/app/_components/ui/button";
import { Spinner } from "~/app/_components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/app/_components/ui/tooltip";
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
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="outline"
            aria-label={isGenerating ? "Generating PDF" : "Download all days as PDF"}
            onClick={handleClick}
            disabled={disabled || isGenerating}
          />
        }
      >
        {isGenerating ? (
          <Spinner className="h-4 w-4" />
        ) : (
          <FileDown className="h-4 w-4" />
        )}
        {isGenerating ? "Generating..." : "Generate PDF"}
      </TooltipTrigger>
      <TooltipContent>Download all days as PDF</TooltipContent>
    </Tooltip>
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
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-gray-400 hover:bg-sky-50 hover:text-sky-600"
            aria-label={isGenerating ? "Generating PDF" : "Download PDF"}
            onClick={handleClick}
            disabled={disabled || isGenerating}
          />
        }
      >
        {isGenerating ? (
          <Spinner className="h-4 w-4" />
        ) : (
          <FileDown className="h-4 w-4" />
        )}
      </TooltipTrigger>
      <TooltipContent>Download PDF</TooltipContent>
    </Tooltip>
  );
}
