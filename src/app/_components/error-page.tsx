"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Navbar } from "./navbar";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
  title: string;
  subtitle?: string;
};

export function ErrorPage({ error, reset, title, subtitle }: ErrorPageProps) {
  useEffect(() => {
    console.error(`${title} error:`, error);
  }, [error, title]);

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-orange-50">
      <Navbar title={title} subtitle={subtitle ?? "Something went wrong"} />

      <main className="container mx-auto px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg border border-red-200 bg-red-50 p-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-red-900">
                  Error Loading {title}
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
                type="button"
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
