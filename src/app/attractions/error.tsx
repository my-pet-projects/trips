"use client";

import { AlertCircle, MapPin } from "lucide-react";
import { useEffect } from "react";

export default function Error({
  errorInfo: error,
  reset,
}: {
  errorInfo: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    // TODO: Replicate the main layout's wrapper structure
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50">
      {/* Replicate essential header content if desired */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-foreground text-2xl font-bold">
                Attractions
              </h1>
              <p className="text-muted-foreground text-sm">
                Something went wrong
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area for the error message */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100 shadow-lg">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-foreground mb-3 text-3xl font-bold">
            Something went wrong
          </h2>
          <p className="text-muted-foreground mb-4 max-w-md text-lg">
            {error.message || "Failed to load attractions"}
          </p>
          {error.digest && (
            <p className="text-muted-foreground mb-8 font-mono text-sm">
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            className="rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
