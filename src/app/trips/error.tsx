"use client";

import { AlertCircle, Building, Calendar, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Trips page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50">
      {/* Header - matches list page with invisible spacer */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Invisible spacer to maintain alignment */}
              <div className="h-10 w-10" />
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100">
                <Calendar className="h-6 w-6 text-sky-600" />
              </div>
              <div>
                <h1 className="text-foreground text-2xl font-bold">Trips</h1>
                <p className="text-muted-foreground text-sm">
                  Something went wrong
                </p>
              </div>
            </div>
            <nav className="flex items-center gap-4">
              <Link
                href="/attractions"
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
              >
                <Building className="mr-2 h-4 w-4" />
                Attractions
              </Link>
              <Link
                href="/trips/new"
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Trip
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg border border-red-200 bg-red-50 p-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-red-900">
                  Error Loading Trips
                </h2>
                <p className="text-sm text-red-700">
                  We encountered a problem while loading this page
                </p>
              </div>
            </div>

            <div className="mb-6 rounded border border-red-300 bg-white p-4">
              <p className="font-mono text-sm text-red-800">
                {error.message || "An unexpected error occurred"}
              </p>
              {error.digest && (
                <p className="mt-2 text-xs text-red-600">
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={reset}
                className="flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-6 font-medium text-white transition-colors hover:bg-red-700"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
              <Link
                href="/"
                className="flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
