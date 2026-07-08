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
import { generateAllPlansPdf, generatePlanBlockPdf } from "~/lib/pdf";
import { usePdfGeneration } from "~/lib/pdf/use-pdf-generation";
import type { PlanBlock } from "~/types";

type PlanBlocksPdfButtonProps = {
  blocks: PlanBlock[];
  tripName: string;
  blockColors: Map<number, string>;
  disabled?: boolean;
};

export function PlanBlocksPdfButton({
  blocks,
  tripName,
  blockColors,
  disabled = false,
}: PlanBlocksPdfButtonProps) {
  const { isGenerating, generate } = usePdfGeneration();

  const handleClick = useCallback(() => {
    void generate(
      (onProgress) =>
        generateAllPlansPdf(blocks, tripName, blockColors, onProgress),
      {
        loadingMessage: "Starting PDF generation...",
        successDescription: "Full itinerary has been saved.",
      },
    );
  }, [blocks, tripName, blockColors, generate]);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="outline"
            aria-label={isGenerating ? "Generating PDF" : "Download all plans as PDF"}
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
      <TooltipContent>Download all plans as PDF</TooltipContent>
    </Tooltip>
  );
}

type PlanBlockPdfButtonProps = {
  block: PlanBlock;
  color: string;
  disabled?: boolean;
};

export function PlanBlockPdfButton({
  block,
  color,
  disabled = false,
}: PlanBlockPdfButtonProps) {
  const { isGenerating, generate } = usePdfGeneration();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      void generate(() => generatePlanBlockPdf(block, undefined, color), {
        successDescription: `${block.name} itinerary has been saved.`,
      });
    },
    [block, color, generate],
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
