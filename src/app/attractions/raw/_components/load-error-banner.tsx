"use client";

import { AlertCircle } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "~/app/_components/ui/alert";
import { Button } from "~/app/_components/ui/button";

interface LoadErrorBannerProps {
  message: string;
  onRetry: () => void;
}

export function LoadErrorBanner({ message, onRetry }: LoadErrorBannerProps) {
  return (
    <div className="absolute top-16 right-3 left-3 z-1001 md:top-20 md:right-auto md:left-1/2 md:w-full md:max-w-md md:-translate-x-1/2">
      <Alert
        variant="destructive"
        className="border-red-200 bg-red-50 px-4 py-3 shadow-md [&>svg]:text-red-500"
      >
        <AlertCircle />
        <AlertTitle className="text-red-900">Failed to load data</AlertTitle>
        <AlertDescription className="text-red-700">{message}</AlertDescription>
        <Button
          type="button"
          size="sm"
          className="mt-2 h-7 bg-red-600 text-xs hover:bg-red-700"
          onClick={onRetry}
        >
          Try again
        </Button>
      </Alert>
    </div>
  );
}
