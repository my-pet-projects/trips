"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

type PdfGenerationOptions = {
  loadingMessage?: string;
  successDescription?: string;
  onProgress?: (status: string) => void;
};

export function usePdfGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(
    async (
      task: (onProgress?: (status: string) => void) => Promise<void>,
      options: PdfGenerationOptions = {},
    ) => {
      setIsGenerating(true);
      const toastId = options.loadingMessage
        ? toast.loading(options.loadingMessage)
        : undefined;

      try {
        await task((status) => {
          options.onProgress?.(status);
          if (toastId) {
            toast.loading(status, { id: toastId });
          }
        });
        toast.success("PDF downloaded", {
          id: toastId,
          description: options.successDescription,
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
    },
    [],
  );

  return { isGenerating, generate };
}
