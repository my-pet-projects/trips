"use client";

import { FileDown, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { generateAllDaysPdf, generateDayPdf } from "~/lib/pdf";
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
  const [isGenerating, setIsGenerating] = useState(false);

  const handleClick = useCallback(async () => {
    setIsGenerating(true);
    const toastId = toast.loading("Starting PDF generation...");
    try {
      await generateAllDaysPdf(days, tripName, dayColors, (status) => {
        toast.loading(status, { id: toastId });
      });
      toast.success("PDF downloaded", {
        id: toastId,
        description: "Full itinerary has been saved.",
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate PDF", {
        id: toastId,
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [days, tripName, dayColors]);

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
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
  const [isGenerating, setIsGenerating] = useState(false);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsGenerating(true);
      try {
        await generateDayPdf(day, undefined, color);
        toast.success("PDF downloaded", {
          description: `${day.name} itinerary has been saved.`,
        });
      } catch (error) {
        console.error("PDF generation failed:", error);
        toast.error("Failed to generate PDF", {
          description:
            error instanceof Error ? error.message : "Please try again.",
        });
      } finally {
        setIsGenerating(false);
      }
    },
    [day, color],
  );

  return (
    <button
      type="button"
      onClick={(e) => void handleClick(e)}
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
